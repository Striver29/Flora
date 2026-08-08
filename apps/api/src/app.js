import express from 'express';
import { ErrorCode, fail, ok } from '@flora/shared';
import { config as defaultConfig } from './config.js';
import { createRecognitionProvider } from './recognition/index.js';
import { createDiagnosisRoutes } from './modules/diagnoses/routes.js';
import { createDiagnosisService } from './modules/diagnoses/service.js';
import { createDiagnosisStore } from './modules/diagnoses/store.js';

/**
 * Build the Express app.
 *
 * Dependencies are injectable so tests can supply a fake recognizer and an
 * isolated store without touching the environment or the network.
 *
 * @param {{
 *   config?: ReturnType<import('./config.js').loadConfig>,
 *   recognize?: (input: object) => Promise<object>,
 *   store?: ReturnType<typeof createDiagnosisStore>,
 *   logger?: Console,
 * }} [overrides]
 */
export function createApp({
  config = defaultConfig,
  recognize = createRecognitionProvider(config),
  store = createDiagnosisStore(),
  logger = console,
} = {}) {
  const app = express();

  // Base64 images inflate ~33%, and the ceiling is a request-size guard, not the
  // real image check — service.create rejects oversized images with a VALIDATION
  // envelope so the client gets a usable message instead of a bare 413.
  app.use(express.json({ limit: Math.ceil((config.maxImageBytes * 4) / 3) + 1024 }));

  const service = createDiagnosisService({
    store,
    recognize,
    maxImageBytes: config.maxImageBytes,
    timeoutMs: config.recognitionTimeoutMs,
    logger,
  });

  app.get('/health', (_req, res) => res.json(ok({ status: 'up' })));
  app.use('/diagnoses', createDiagnosisRoutes({ service }));

  app.use((_req, res) => {
    res.status(404).json(fail(ErrorCode.NOT_FOUND, 'route not found'));
  });

  // Four-arg signature is what marks this as Express's error handler — `next`
  // is unused but removing it silently turns this into ordinary middleware.
  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    logger.error('[api] unhandled error:', error);
    const tooLarge = error?.type === 'entity.too.large';
    res
      .status(tooLarge ? 413 : 500)
      .json(
        tooLarge
          ? fail(ErrorCode.VALIDATION, 'Image is too large')
          : fail(ErrorCode.INTERNAL, 'Something went wrong'),
      );
  });

  return app;
}
