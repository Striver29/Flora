import { z } from 'zod';
import { CreateDiagnosisSchema, ErrorCode, fail } from '@flora/shared';

export { CreateDiagnosisSchema };

/** Path/route identifiers. */
export const IdSchema = z.string().min(1);

/**
 * Parse with a zod schema, converting a failure into a VALIDATION ApiResponse.
 * Mirrors the mock client's parseWith so both sides report validation the same
 * way.
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} input
 * @returns {{data: T, error: null} | {data: null, error: import('@flora/shared/src/types.js').ApiResponse<never>}}
 */
export function parseWith(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data, error: null };

  const issue = result.error.issues[0];
  const path = issue.path.join('.');
  return {
    data: null,
    error: fail(ErrorCode.VALIDATION, path ? `${path}: ${issue.message}` : issue.message),
  };
}

/**
 * Decoded byte length of a base64 string, without allocating a Buffer for it.
 * @param {string} base64
 * @returns {number}
 */
export function base64ByteLength(base64) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}
