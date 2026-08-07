import Constants from 'expo-constants';

const DEFAULT_PORT = 4000;
const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Work out where the API lives.
 *
 * On a physical phone `localhost` is the phone, not your laptop, so the default
 * is derived from the host Metro is already being served from — the same LAN
 * address Expo Go connected to. Set EXPO_PUBLIC_API_URL to override (a tunnel,
 * a deployed environment, an emulator's host alias).
 *
 * @returns {string} base URL with no trailing slash
 */
export function resolveBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  // hostUri looks like "192.168.1.20:8081"; expoGoConfig.debuggerHost is the
  // older SDK spelling of the same thing.
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? '';
  const host = hostUri.split(':')[0];

  return host ? `http://${host}:${DEFAULT_PORT}` : `http://localhost:${DEFAULT_PORT}`;
}

/**
 * Call the Flora API and return its ApiResponse envelope.
 *
 * Never throws: transport failures are converted into the same
 * `{ ok: false, error }` shape the API itself returns, so screens handle one
 * outcome type regardless of whether the failure was network or server side.
 *
 * @param {string} path e.g. '/diagnoses'
 * @param {{method?: string, body?: unknown, timeoutMs?: number}} [options]
 * @returns {Promise<import('@flora/shared/src/types.js').ApiResponse<any>>}
 */
export async function apiFetch(path, { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const url = `${resolveBaseUrl()}${path}`;

  // AbortSignal.timeout is not reliably present in the RN runtime; drive the
  // abort by hand so a wedged request cannot hang the screen forever.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!text) {
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Empty response from ${url}` },
      };
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      // A proxy, a captive portal, or the wrong port — anything but our API.
      return {
        ok: false,
        error: { code: 'INTERNAL', message: `Unexpected response from ${url}` },
      };
    }

    // The API always answers in the envelope, including on 4xx/5xx.
    if (typeof payload?.ok === 'boolean') return payload;

    return {
      ok: false,
      error: { code: 'INTERNAL', message: `Malformed response from ${url}` },
    };
  } catch (error) {
    const aborted = error?.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: aborted ? 'PROVIDER_ERROR' : 'INTERNAL',
        message: aborted
          ? `The API did not respond within ${Math.round(timeoutMs / 1000)}s`
          : `Could not reach the API at ${url}. Is it running, and on the same network?`,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
