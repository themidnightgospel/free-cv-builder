import { afterEach, describe, expect, it } from 'vitest';
import { writeSavedCvsToStorage } from '../../src/state/useCvPersistence';
import type { SavedCvRecord } from '../../src/state/cvStorage';
import { createInitialCv } from '../../src/state/cvModel';

const record = (): SavedCvRecord => ({
  id: 'r1',
  name: 'Test',
  updatedAt: 1,
  cv: createInitialCv(),
});

const stubStorage = (setItem: () => void) => {
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: { setItem, getItem: () => null, removeItem: () => {} },
  };
};

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('writeSavedCvsToStorage', () => {
  it('reports success when the write lands', () => {
    stubStorage(() => {});
    expect(writeSavedCvsToStorage([record()])).toBe(true);
  });

  it('reports failure when storage is full rather than swallowing it', () => {
    stubStorage(() => {
      const error = new Error('exceeded the quota');
      error.name = 'QuotaExceededError';
      throw error;
    });
    // Silently returning undefined here is what lets the header keep
    // showing "Saved" while the user's work is not persisted.
    expect(writeSavedCvsToStorage([record()])).toBe(false);
  });
});
