import { describe, expect, it } from 'vitest';
import { workerName } from '../index.js';

describe('workers placeholder', () => {
  it('exports the package name', () => {
    expect(workerName()).toBe('workers');
  });
});
