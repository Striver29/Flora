import { ErrorCode, LOW_CONFIDENCE_THRESHOLD, fail, ok } from '@flora/shared';
import { RecognitionProviderError } from '../../recognition/index.js';
import { shouldAdvise } from '../../llm/careAdvice.js';
import { resolveSpeciesId as defaultResolveSpeciesId } from '../species/catalog.js';
import { CreateDiagnosisSchema, IdSchema, base64ByteLength, parseWith } from './validators.js';

/**
 * Shape a stored row for the wire. Deliberately matches the mobile mock's
 * diagnosis view so the two clients stay interchangeable.
 * @param {object} row
 */
function toView(row) {
  return {
    id: row.id,
    plantId: row.plantId,
    // Null until the S3 upload path lands; mobile renders the photo from the
    // local capture it already holds.
    imageUri: row.imageUri ?? null,
    status: row.status,
    result: row.result,
    lowConfidence: row.lowConfidence,
    error: row.error ?? null,
  };
}

/**
 * Create the diagnoses service.
 *
 * The job model is inline-with-polling: `create` writes a PENDING row, starts
 * the provider call without awaiting it, and returns immediately; the client
 * polls `get` until the row flips. That is the same contract a queue would
 * expose, which is what makes the later move to SQS + Lambda a swap of this
 * function's middle rather than a client change.
 *
 * @param {{
 *   store: ReturnType<import('./store.js').createDiagnosisStore>,
 *   recognize: (input: object) => Promise<object>,
 *   advise?: (result: object, context: object) => Promise<object>,
 *   resolveSpeciesId?: (name: string) => (string|null),
 *   maxImageBytes: number,
 *   timeoutMs: number,
 *   logger?: Pick<Console, 'error'>,
 *   now?: () => number,
 * }} deps
 */
export function createDiagnosisService({
  store,
  recognize,
  advise,
  resolveSpeciesId = defaultResolveSpeciesId,
  maxImageBytes,
  timeoutMs,
  logger = console,
  now = Date.now,
}) {
  /**
   * In-flight recognition promises, keyed by diagnosis id. Only used so tests
   * (and a future graceful shutdown) can await work that `create` intentionally
   * did not await.
   * @type {Map<string, Promise<void>>}
   */
  const inflight = new Map();

  /**
   * Attach a care plan to a recognition result.
   *
   * Advice is an enhancement, never a gate: any failure here returns the result
   * untouched with `advice: null`, and the mobile screen falls back to the
   * provider's own treatmentHints. A diagnosis must never fail because the
   * model was slow, refused, or is not configured.
   *
   * @param {import('@flora/shared/src/types.js').RecognitionResult} result
   * @param {{climateZone?: string}} context
   */
  async function withAdvice(result, context) {
    if (!advise || !shouldAdvise(result)) return result;
    try {
      return { ...result, advice: await advise(result, context) };
    } catch (error) {
      logger.error('[diagnoses] care advice failed, continuing without it:', error);
      return result;
    }
  }

  /**
   * Run recognition and write the outcome back. Never rejects — a diagnosis
   * that fails is a FAILED row, not an unhandled rejection that takes down the
   * process.
   * @param {string} id
   * @param {{imageBase64: string, mode: string, climateZone?: string}} input
   */
  async function run(id, { imageBase64, mode, climateZone }) {
    try {
      const recognized = await recognize({ imageBase64, mode, resolveSpeciesId });
      const result = await withAdvice(recognized, { climateZone });
      store.update(id, {
        status: 'COMPLETE',
        result,
        lowConfidence: result.health.confidence < LOW_CONFIDENCE_THRESHOLD,
        completedAt: now(),
      });
    } catch (error) {
      const isProviderError = error instanceof RecognitionProviderError;
      logger.error(`[diagnoses] ${id} failed:`, error);
      store.update(id, {
        status: 'FAILED',
        error: {
          code: isProviderError ? ErrorCode.PROVIDER_ERROR : ErrorCode.INTERNAL,
          message: isProviderError ? error.message : 'Recognition failed',
        },
        completedAt: now(),
      });
    } finally {
      inflight.delete(id);
    }
  }

  return {
    /**
     * Start a diagnosis. Returns as soon as the row exists — the provider call
     * is still running.
     * @param {unknown} input
     */
    create(input) {
      const { data, error } = parseWith(CreateDiagnosisSchema, input);
      if (error) return error;

      const bytes = base64ByteLength(data.imageBase64);
      if (bytes > maxImageBytes) {
        return fail(
          ErrorCode.VALIDATION,
          `Image is ${Math.round(bytes / 1024)}KB; the limit is ${Math.round(maxImageBytes / 1024)}KB`,
        );
      }

      const row = store.insert({
        plantId: data.plantId ?? null,
        mode: data.mode,
        status: 'PENDING',
        result: null,
        lowConfidence: null,
        error: null,
        createdAt: now(),
        completedAt: null,
      });

      inflight.set(
        row.id,
        run(row.id, {
          imageBase64: data.imageBase64,
          mode: data.mode,
          climateZone: data.climateZone,
        }),
      );

      return ok({ id: row.id, status: row.status });
    },

    /**
     * Poll a diagnosis.
     *
     * Sweeps on read: a PENDING row older than the provider timeout has no
     * worker coming back for it (the process restarted, or the call is wedged),
     * so report FAILED rather than let the client poll for its full 90s budget.
     * @param {unknown} id
     */
    get(id) {
      const check = parseWith(IdSchema, id);
      if (check.error) return check.error;

      const row = store.find(check.data);
      if (!row) return fail(ErrorCode.NOT_FOUND, `diagnosis ${check.data} not found`);

      if (row.status === 'PENDING' && now() - row.createdAt > timeoutMs) {
        const swept = store.update(row.id, {
          status: 'FAILED',
          error: { code: ErrorCode.PROVIDER_ERROR, message: 'Recognition timed out' },
          completedAt: now(),
        });
        return ok(toView(swept));
      }

      return ok(toView(row));
    },

    /**
     * Await the in-flight recognition for a diagnosis, if any.
     * Test affordance — production code polls instead.
     * @param {string} id
     */
    async settled(id) {
      await inflight.get(id);
    },
  };
}
