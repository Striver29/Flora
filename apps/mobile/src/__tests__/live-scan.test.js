import { liveClient } from '../api/liveClient.js';
import { resolveBaseUrl } from '../api/http.js';

jest.mock('expo-constants', () => ({ expoConfig: { hostUri: '192.168.1.20:8081' } }));

/**
 * @param {{ok?: boolean, status?: number, body?: unknown}} [options]
 */
function mockFetch({ ok = true, status = 200, body = { ok: true, data: {} } } = {}) {
  const impl = jest.fn(async () => ({
    ok,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }));
  global.fetch = impl;
  return impl;
}

describe('resolveBaseUrl', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it('derives the LAN address from the Metro host so a phone can reach it', () => {
    // localhost on a physical device is the phone itself — this is the bug the
    // derivation exists to prevent.
    expect(resolveBaseUrl()).toBe('http://192.168.1.20:4000');
  });

  it('prefers an explicit override and strips a trailing slash', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';
    expect(resolveBaseUrl()).toBe('https://api.example.com');
  });
});

describe('liveClient.diagnoses', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('posts the image bytes to the API', async () => {
    const fetchImpl = mockFetch({ body: { ok: true, data: { id: 'dg_x1', status: 'PENDING' } } });

    const res = await liveClient.diagnoses.create({
      imageUri: 'file:///tmp/photo.jpg',
      imageBase64: 'aGVsbG8=',
      mode: 'health',
      plantId: 'p2',
    });

    expect(res).toEqual({ ok: true, data: { id: 'dg_x1', status: 'PENDING' } });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://192.168.1.20:4000/diagnoses');
    expect(JSON.parse(init.body)).toEqual({
      imageBase64: 'aGVsbG8=',
      mode: 'health',
      plantId: 'p2',
    });
    // The local file URI is meaningless to the server and must not be sent.
    expect(init.body).not.toContain('file:///');
  });

  it('rejects a capture that came back without bytes, without calling the API', async () => {
    const fetchImpl = mockFetch();

    const res = await liveClient.diagnoses.create({ imageUri: 'file:///tmp/photo.jpg' });

    expect(res.ok).toBe(false);
    expect(res.error.code).toBe('VALIDATION');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('passes an error envelope straight through', async () => {
    mockFetch({
      ok: false,
      status: 404,
      body: { ok: false, error: { code: 'NOT_FOUND', message: 'diagnosis dg_x1 not found' } },
    });

    const res = await liveClient.diagnoses.get('dg_x1');
    expect(res).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'diagnosis dg_x1 not found' },
    });
  });

  it('url-encodes the diagnosis id', async () => {
    const fetchImpl = mockFetch({ body: { ok: true, data: {} } });
    await liveClient.diagnoses.get('dg /1');
    expect(fetchImpl.mock.calls[0][0]).toBe('http://192.168.1.20:4000/diagnoses/dg%20%2F1');
  });

  it('turns an unreachable API into an envelope, not a thrown error', async () => {
    global.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    });

    const res = await liveClient.diagnoses.get('dg_x1');
    expect(res.ok).toBe(false);
    expect(res.error.message).toMatch(/Could not reach the API/);
  });

  it('turns a non-JSON response into an envelope', async () => {
    mockFetch({ body: '<html>502 Bad Gateway</html>' });

    const res = await liveClient.diagnoses.get('dg_x1');
    expect(res.ok).toBe(false);
    expect(res.error.message).toMatch(/Unexpected response/);
  });

  it('still refuses the methods that have no API behind them', async () => {
    await expect(liveClient.diagnoses.attach('dg_x1', 'p1')).rejects.toThrow(/not implemented/);
    await expect(liveClient.plants.list()).rejects.toThrow(/not implemented/);
  });
});
