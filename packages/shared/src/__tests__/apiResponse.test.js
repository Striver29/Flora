import { describe, expect, it } from 'vitest';
import { fail, ok } from '../index.js';

describe('ApiResponse helpers', () => {
  it('ok() wraps data in a success envelope', () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });
  });

  it('fail() wraps code and message in an error envelope', () => {
    expect(fail('NOT_FOUND', 'species not found')).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'species not found' },
    });
  });
});
