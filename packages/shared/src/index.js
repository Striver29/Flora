/**
 * @template T
 * @typedef {{ ok: true, data: T } | { ok: false, error: { code: string, message: string } }} ApiResponse
 */

/**
 * Wrap a successful payload in the standard API envelope.
 * @template T
 * @param {T} data
 * @returns {ApiResponse<T>}
 */
export function ok(data) {
  return { ok: true, data };
}

/**
 * Wrap an error in the standard API envelope.
 * @param {string} code machine-readable error code (e.g. "NOT_FOUND")
 * @param {string} message human-readable description
 * @returns {ApiResponse<never>}
 */
export function fail(code, message) {
  return { ok: false, error: { code, message } };
}
