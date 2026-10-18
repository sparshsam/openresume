import { beforeEach, describe, expect, it } from 'vitest';
import { DRAFT_KEY, clearDraft, isResume, loadDraft, saveDraft } from '../src/lib/storage';
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

describe('storage', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it('saves and loads a resume', () => {
    const resume = createSampleResume();
    saveDraft(resume, storage);
    expect(loadDraft(storage)).toEqual(resume);
  });

  it('returns null when no draft exists', () => {
    expect(loadDraft(storage)).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    storage.setItem(DRAFT_KEY, '{not json');
    expect(loadDraft(storage)).toBeNull();
  });

  it('returns null for an unsupported schema version', () => {
    storage.setItem(DRAFT_KEY, JSON.stringify({ schemaVersion: 99, sections: [] }));
    expect(loadDraft(storage)).toBeNull();
  });

  it('clears a draft', () => {
    saveDraft(createSampleResume(), storage);
    clearDraft(storage);
    expect(loadDraft(storage)).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(() => saveDraft(createSampleResume(), broken)).not.toThrow();
    expect(loadDraft(broken)).toBeNull();
    expect(() => clearDraft(broken)).not.toThrow();
  });

  it('validates resume shape', () => {
    expect(isResume(createSampleResume())).toBe(true);
    expect(isResume({})).toBe(false);
    expect(isResume(null)).toBe(false);
  });
});
