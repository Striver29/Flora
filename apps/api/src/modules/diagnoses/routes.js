import { Router } from 'express';
import { ErrorCode } from '@flora/shared';

/** ErrorCode -> HTTP status. The envelope carries the real code; this is for proxies and logs. */
const STATUS_BY_CODE = Object.freeze({
  [ErrorCode.VALIDATION]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.PROVIDER_ERROR]: 502,
  [ErrorCode.INTERNAL]: 500,
});

/**
 * @param {import('@flora/shared/src/types.js').ApiResponse<unknown>} response
 * @param {number} okStatus
 */
function statusFor(response, okStatus) {
  if (response.ok) return okStatus;
  return STATUS_BY_CODE[response.error.code] ?? 500;
}

/**
 * Diagnosis routes. Thin by design — everything decidable lives in service.js.
 * @param {{service: ReturnType<import('./service.js').createDiagnosisService>}} deps
 */
export function createDiagnosisRoutes({ service }) {
  const router = Router();

  // 202: the row exists, the recognition is still running. Poll the GET below.
  router.post('/', (req, res) => {
    const response = service.create(req.body);
    res.status(statusFor(response, 202)).json(response);
  });

  router.get('/:id', (req, res) => {
    const response = service.get(req.params.id);
    res.status(statusFor(response, 200)).json(response);
  });

  return router;
}
