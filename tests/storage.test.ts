import { beforeEach, describe, expect, it } from 'vitest';
import {
  COVER_LETTER_DRAFT_KEY,
  DRAFT_KEY,
  clearLegacyDrafts,
  isCoverLetter,
  isResume,
} from '../src/lib/storage';
import { createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { createSampleResume } from '../src/lib/sample';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

describe('legacy draft cleanup', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('removes identified resume and cover letter entries', () => {
    storage.setItem(DRAFT_KEY, JSON.stringify(createSampleResume()));
    storage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify(createSampleCoverLetter()));

    clearLegacyDrafts(storage);

    expect(storage.getItem(DRAFT_KEY)).toBeNull();
    expect(storage.getItem(COVER_LETTER_DRAFT_KEY)).toBeNull();
  });

  it('leaves unrelated storage and the theme preference untouched', () => {
    storage.setItem('another-app:draft', '{"keep":true}');
    storage.setItem('openresume-theme', 'dark');
    storage.setItem(DRAFT_KEY, JSON.stringify(createSampleResume()));

    clearLegacyDrafts(storage);

    expect(storage.getItem('another-app:draft')).toBe('{"keep":true}');
    expect(storage.getItem('openresume-theme')).toBe('dark');
    expect(storage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('leaves unreadable or unrecognized values in place', () => {
    storage.setItem(DRAFT_KEY, '{not json');
    storage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify({ schemaVersion: 99 }));

    clearLegacyDrafts(storage);

    expect(storage.getItem(DRAFT_KEY)).toBe('{not json');
    expect(storage.getItem(COVER_LETTER_DRAFT_KEY)).toBe('{"schemaVersion":99}');
  });

  it('does not throw when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;

    expect(() => clearLegacyDrafts(broken)).not.toThrow();
  });

  it('validates resume and cover letter shapes', () => {
    expect(isResume(createSampleResume())).toBe(true);
    expect(isResume({})).toBe(false);
    expect(isResume(null)).toBe(false);

    expect(isCoverLetter(createSampleCoverLetter())).toBe(true);
    expect(isCoverLetter({})).toBe(false);
    expect(isCoverLetter(null)).toBe(false);
  });
});
