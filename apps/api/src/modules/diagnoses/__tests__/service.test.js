import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecognitionProviderError } from '../../../recognition/index.js';
import { createDiagnosisService } from '../service.js';
import { createDiagnosisStore } from '../store.js';

const IMAGE = Buffer.from('a fake jpeg').toString('base64');

/** A minimal healthy RecognitionResult. */
const healthy = {
  species: [
    { speciesId: 'sp1', scientificName: 'Ocimum basilicum', commonNames: ['Basil'], probability: 0.93 },
  ],
  health: { isHealthy: true, issues: [], confidence: 0.91 },
};

/** Same shape, but under the low-confidence threshold. */
const uncertain = {
  species: [{ scientificName: 'Hedera helix', commonNames: [], probability: 0.31 }],
  health: { isHealthy: true, issues: [], confidence: 0.31 },
};

/**
 * @param {{recognize?: Function, now?: () => number, timeoutMs?: number, maxImageBytes?: number}} [overrides]
 */
function makeService(overrides = {}) {
  const store = createDiagnosisStore();
  const logger = overrides.logger ?? { error: vi.fn() };
  const service = createDiagnosisService({
    store,
    recognize: overrides.recognize ?? (async () => healthy),
    maxImageBytes: overrides.maxImageBytes ?? 1024 * 1024,
    timeoutMs: overrides.timeoutMs ?? 45_000,
    logger,
    ...(overrides.advise ? { advise: overrides.advise } : {}),
    ...(overrides.now ? { now: overrides.now } : {}),
  });
  return { service, store, logger };
}

/** A schema-valid care plan, as the LLM provider would return it. */
const advice = {
  summary: 'Healthy basil. Keep it productive.',
  steps: [
    { action: 'Pinch off flower buds', when: 'Weekly', why: 'Flowering turns the leaves bitter' },
  ],
  watchFor: [],
};

describe('diagnoses service', () => {
  let service;

  beforeEach(() => {
    ({ service } = makeService());
  });

  it('returns PENDING immediately, before recognition finishes', () => {
    const response = service.create({ imageBase64: IMAGE, mode: 'identify' });

    expect(response.ok).toBe(true);
    expect(response.data.status).toBe('PENDING');
    expect(service.get(response.data.id).data.status).toBe('PENDING');
  });

  it('flips to COMPLETE with the recognition result', async () => {
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    const view = service.get(id).data;
    expect(view.status).toBe('COMPLETE');
    expect(view.result).toEqual(healthy);
    expect(view.lowConfidence).toBe(false);
  });

  it('flags results below the confidence threshold', async () => {
    ({ service } = makeService({ recognize: async () => uncertain }));
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    expect(service.get(id).data.lowConfidence).toBe(true);
  });

  it('passes the mode and a species resolver through to the provider', async () => {
    const recognize = vi.fn(async () => healthy);
    ({ service } = makeService({ recognize }));

    const { id } = service.create({ imageBase64: IMAGE, mode: 'health' }).data;
    await service.settled(id);

    expect(recognize).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'health', resolveSpeciesId: expect.any(Function) }),
    );
  });

  it('defaults the mode to identify', async () => {
    const recognize = vi.fn(async () => healthy);
    ({ service } = makeService({ recognize }));

    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    expect(recognize.mock.calls[0][0].mode).toBe('identify');
  });

  it('records a provider failure as FAILED rather than rejecting', async () => {
    ({ service } = makeService({
      recognize: async () => {
        throw new RecognitionProviderError('Plant.id returned 401', { status: 401 });
      },
    }));

    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    const view = service.get(id).data;
    expect(view.status).toBe('FAILED');
    expect(view.error).toEqual({ code: 'PROVIDER_ERROR', message: 'Plant.id returned 401' });
  });

  it('does not leak internal error text on an unexpected failure', async () => {
    ({ service } = makeService({
      recognize: async () => {
        throw new Error('connect ECONNREFUSED 10.0.0.1:5432');
      },
    }));

    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    const view = service.get(id).data;
    expect(view.error).toEqual({ code: 'INTERNAL', message: 'Recognition failed' });
  });

  it('sweeps a PENDING row that outlived the provider timeout', () => {
    let clock = 1_000;
    ({ service } = makeService({
      now: () => clock,
      timeoutMs: 45_000,
      // Never settles — simulates a wedged call or a restarted process.
      recognize: () => new Promise(() => {}),
    }));

    const { id } = service.create({ imageBase64: IMAGE }).data;
    expect(service.get(id).data.status).toBe('PENDING');

    clock += 45_001;
    const view = service.get(id).data;
    expect(view.status).toBe('FAILED');
    expect(view.error.message).toMatch(/timed out/);
  });

  it('rejects an oversized image with a readable message', () => {
    ({ service } = makeService({ maxImageBytes: 10 }));
    const response = service.create({ imageBase64: IMAGE });

    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('VALIDATION');
    expect(response.error.message).toMatch(/the limit is/);
  });

  it('strips a data URL prefix before measuring or forwarding the image', async () => {
    const recognize = vi.fn(async () => healthy);
    ({ service } = makeService({ recognize }));

    const { id } = service.create({ imageBase64: `data:image/jpeg;base64,${IMAGE}` }).data;
    await service.settled(id);

    expect(recognize.mock.calls[0][0].imageBase64).toBe(IMAGE);
  });

  it.each([
    ['a missing image', {}],
    ['an empty image', { imageBase64: '' }],
    ['a non-base64 image', { imageBase64: 'not base64!!' }],
    ['an unknown mode', { imageBase64: IMAGE, mode: 'vibes' }],
  ])('rejects %s', (_label, input) => {
    const response = service.create(input);
    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('VALIDATION');
  });

  it('reports an unknown id as NOT_FOUND', () => {
    const response = service.get('dg_nope');
    expect(response.ok).toBe(false);
    expect(response.error.code).toBe('NOT_FOUND');
  });

  it('keeps concurrent diagnoses separate', async () => {
    const recognize = vi.fn(async ({ mode }) => (mode === 'health' ? uncertain : healthy));
    ({ service } = makeService({ recognize }));

    const first = service.create({ imageBase64: IMAGE, mode: 'identify' }).data;
    const second = service.create({ imageBase64: IMAGE, mode: 'health' }).data;
    await Promise.all([service.settled(first.id), service.settled(second.id)]);

    expect(first.id).not.toBe(second.id);
    expect(service.get(first.id).data.lowConfidence).toBe(false);
    expect(service.get(second.id).data.lowConfidence).toBe(true);
  });
});

describe('care advice', () => {
  it('attaches advice to a completed diagnosis', async () => {
    const { service } = makeService({ advise: async () => advice });
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    const view = service.get(id).data;
    expect(view.status).toBe('COMPLETE');
    expect(view.result.advice).toEqual(advice);
    // The recognition half must come through untouched alongside it.
    expect(view.result.species).toEqual(healthy.species);
  });

  it('passes the climate zone through to the advice call', async () => {
    const advise = vi.fn().mockResolvedValue(advice);
    const { service } = makeService({ advise });
    const { id } = service.create({ imageBase64: IMAGE, climateZone: 'BEKAA' }).data;
    await service.settled(id);

    expect(advise).toHaveBeenCalledWith(healthy, { climateZone: 'BEKAA' });
  });

  it('skips the call entirely on a low-confidence result', async () => {
    const advise = vi.fn().mockResolvedValue(advice);
    const { service } = makeService({ recognize: async () => uncertain, advise });
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    // Advice built on a bad ID is worse than none — and this is what keeps
    // model spend off unusable photos.
    expect(advise).not.toHaveBeenCalled();
    expect(service.get(id).data.status).toBe('COMPLETE');
  });

  it('still completes the diagnosis when the model fails', async () => {
    const logger = { error: vi.fn() };
    const { service } = makeService({
      advise: async () => {
        throw new Error('Bedrock exploded');
      },
      logger,
    });
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    const view = service.get(id).data;
    expect(view.status).toBe('COMPLETE');
    expect(view.result.species).toEqual(healthy.species);
    expect(view.error).toBeNull();
    expect(logger.error.mock.calls[0][0]).toMatch(/care advice failed/);
  });

  it('completes normally when no advice provider is configured', async () => {
    const { service } = makeService();
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    expect(service.get(id).data.status).toBe('COMPLETE');
  });

  it('never lets advice rescue a failed recognition', async () => {
    const advise = vi.fn().mockResolvedValue(advice);
    const { service } = makeService({
      recognize: async () => {
        throw new RecognitionProviderError('Plant.id returned 503', { status: 503 });
      },
      advise,
    });
    const { id } = service.create({ imageBase64: IMAGE }).data;
    await service.settled(id);

    expect(service.get(id).data.status).toBe('FAILED');
    expect(advise).not.toHaveBeenCalled();
  });
});
