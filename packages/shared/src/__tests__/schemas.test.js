import { describe, expect, it } from 'vitest';
import {
  CreatePlantSchema,
  CreatePostSchema,
  CreateScheduleSchema,
  RegisterDeviceSchema,
  SignupSchema,
} from '../schemas.js';

/**
 * Collect the dotted issue paths of a failed safeParse.
 * @param {import('zod').ZodSafeParseResult<unknown>} result
 * @returns {string[]}
 */
function issuePaths(result) {
  expect(result.success).toBe(false);
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('SignupSchema', () => {
  it('accepts a valid signup', () => {
    const result = SignupSchema.safeParse({ username: 'flora_fan_01', password: 'supersecret' });
    expect(result.success).toBe(true);
  });

  it('rejects a username with uppercase characters', () => {
    const result = SignupSchema.safeParse({ username: 'Flora', password: 'supersecret' });
    expect(issuePaths(result)).toContain('username');
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = SignupSchema.safeParse({ username: 'flora_fan_01', password: 'short' });
    expect(issuePaths(result)).toContain('password');
  });
});

describe('CreatePlantSchema', () => {
  it('accepts a plant with only a nickname', () => {
    const result = CreatePlantSchema.safeParse({ nickname: 'Fernie' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing nickname', () => {
    const result = CreatePlantSchema.safeParse({ speciesId: 'sp_1' });
    expect(issuePaths(result)).toContain('nickname');
  });

  it('rejects a non-string speciesId', () => {
    const result = CreatePlantSchema.safeParse({ nickname: 'Fernie', speciesId: 42 });
    expect(issuePaths(result)).toContain('speciesId');
  });
});

describe('CreateScheduleSchema', () => {
  it('accepts a watering schedule with an interval', () => {
    const result = CreateScheduleSchema.safeParse({ type: 'WATER', intervalDays: 3 });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown schedule type', () => {
    const result = CreateScheduleSchema.safeParse({ type: 'PRUNE', intervalDays: 3 });
    expect(issuePaths(result)).toContain('type');
  });

  it('rejects a non-positive intervalDays', () => {
    const result = CreateScheduleSchema.safeParse({ type: 'WATER', intervalDays: 0 });
    expect(issuePaths(result)).toContain('intervalDays');
  });
});

describe('CreatePostSchema', () => {
  it('accepts a body-only post and an images-only post', () => {
    expect(CreatePostSchema.safeParse({ body: 'Look at my monstera!' }).success).toBe(true);
    expect(CreatePostSchema.safeParse({ images: ['uploads/1.jpg'] }).success).toBe(true);
  });

  it('rejects a post with neither body nor images', () => {
    const result = CreatePostSchema.safeParse({ body: '   ' });
    expect(issuePaths(result)).toContain('body');
  });

  it('rejects images that are not an array of strings', () => {
    const result = CreatePostSchema.safeParse({ images: 'uploads/1.jpg' });
    expect(issuePaths(result)).toContain('images');
  });
});

describe('RegisterDeviceSchema', () => {
  it('accepts a valid device registration', () => {
    const result = RegisterDeviceSchema.safeParse({
      pushToken: 'ExponentPushToken[abc123]',
      platform: 'ios',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported platform', () => {
    const result = RegisterDeviceSchema.safeParse({ pushToken: 'tok', platform: 'web' });
    expect(issuePaths(result)).toContain('platform');
  });

  it('rejects a missing pushToken', () => {
    const result = RegisterDeviceSchema.safeParse({ platform: 'android' });
    expect(issuePaths(result)).toContain('pushToken');
  });
});
