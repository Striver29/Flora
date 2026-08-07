import { normalizePlantIdResponse } from './normalize.js';

/**
 * Detail fields Plant.id only returns when asked for them. `treatment` is the
 * expensive one and the reason the result screen has anything to show under
 * "Treatment" — drop it and the steps list goes empty.
 */
const DETAIL_FIELDS = ['common_names', 'url', 'description', 'treatment', 'classification'];

/** Raised when the provider is reachable but unhappy. Carries the HTTP status. */
export class RecognitionProviderError extends Error {
  /**
   * @param {string} message
   * @param {{status?: number, cause?: unknown}} [options]
   */
  constructor(message, { status, cause } = {}) {
    super(message, { cause });
    this.name = 'RecognitionProviderError';
    this.status = status;
  }
}

/**
 * Build a Plant.id v3 recognition provider.
 *
 * The returned function is the only thing the rest of the API knows about a
 * provider: bytes in, RecognitionResult out. Swapping vendors means writing
 * another module with this signature.
 *
 * @param {{
 *   apiKey: string,
 *   baseUrl: string,
 *   timeoutMs: number,
 *   fetchImpl?: typeof fetch,
 * }} options
 */
export function createPlantIdProvider({ apiKey, baseUrl, timeoutMs, fetchImpl = fetch }) {
  if (!apiKey) {
    throw new Error('createPlantIdProvider requires an API key');
  }

  const url =
    `${baseUrl}/identification` +
    `?details=${DETAIL_FIELDS.join(',')}` +
    // English only for now; the translation layer will localize from issue codes
    // rather than asking the provider for another language.
    `&language=en`;

  /**
   * @param {{imageBase64: string, mode?: string, resolveSpeciesId?: (name: string) => (string|null)}} input
   * @returns {Promise<import('@flora/shared/src/types.js').RecognitionResult>}
   */
  return async function recognize({ imageBase64, mode, resolveSpeciesId }) {
    let response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [imageBase64],
          // Always ask for health: the result screen shows a verdict banner in
          // both modes. `mode` only decides which signal drives confidence.
          health: 'all',
          similar_images: false,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      throw new RecognitionProviderError(
        timedOut
          ? `Plant.id did not respond within ${timeoutMs}ms`
          : `Could not reach Plant.id: ${error?.message ?? 'network error'}`,
        { cause: error },
      );
    }

    if (!response.ok) {
      // Read the body for the message but never let a huge/HTML error page or a
      // second failure mask the status we actually want to report.
      let detail = '';
      try {
        detail = (await response.text()).slice(0, 300);
      } catch {
        detail = '';
      }
      throw new RecognitionProviderError(
        `Plant.id returned ${response.status}${detail ? `: ${detail}` : ''}`,
        { status: response.status },
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new RecognitionProviderError('Plant.id returned a non-JSON body', { cause: error });
    }

    return normalizePlantIdResponse(payload, { mode, resolveSpeciesId });
  };
}
