import { beforeEach, describe, expect, it } from 'vitest';
import {
  COVER_LETTER_DRAFT_KEY,
  DRAFT_KEY,
  clearCoverLetterDraft,
  clearDraft,
  isCoverLetter,
  isResume,
  loadCoverLetterDraft,
  loadDraft,
  saveCoverLetterDraft,
  saveDraft,
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

  it('upgrades a v0.1.0 draft with no format settings', () => {
    const legacy = createSampleResume();
    const withoutFormat = {
      ...legacy,
      template: { pageSize: 'legal', accent: '#14532D' },
    };
    storage.setItem(DRAFT_KEY, JSON.stringify(withoutFormat));

    const loaded = loadDraft(storage);
    expect(loaded?.template.pageSize).toBe('legal');
    expect(loaded?.template.format.fontSize).toBe('standard');
    expect(loaded?.template.format.density).toBe('balanced');
    expect(loaded?.template.format.paragraphSpacing).toBe('standard');
  });

  it('saves and loads a cover letter', () => {
    const letter = createSampleCoverLetter();
    saveCoverLetterDraft(letter, storage);
    expect(loadCoverLetterDraft(storage)).toEqual(letter);
  });

  it('returns null for corrupt or unsupported cover letter payloads', () => {
    storage.setItem(COVER_LETTER_DRAFT_KEY, '{not json');
    expect(loadCoverLetterDraft(storage)).toBeNull();

    storage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify({ schemaVersion: 99, body: [] }));
    expect(loadCoverLetterDraft(storage)).toBeNull();
  });

  it('keeps resume and cover letter drafts independent', () => {
    const resume = createSampleResume();
    const letter = createSampleCoverLetter();
    saveDraft(resume, storage);
    saveCoverLetterDraft(letter, storage);

    clearDraft(storage);

    expect(loadDraft(storage)).toBeNull();
    expect(loadCoverLetterDraft(storage)).toEqual(letter);

    saveDraft(resume, storage);
    clearCoverLetterDraft(storage);

    expect(loadDraft(storage)).toEqual(resume);
    expect(loadCoverLetterDraft(storage)).toBeNull();
  });

  it('validates cover letter shape', () => {
    expect(isCoverLetter(createSampleCoverLetter())).toBe(true);
    expect(isCoverLetter({})).toBe(false);
    expect(isCoverLetter(null)).toBe(false);
  });

  it('falls back safely for invalid stored formatting', () => {
    const resume = createSampleResume();
    storage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        ...resume,
        template: { pageSize: 'tabloid', accent: '#14532D', format: { fontSize: 'huge' } },
      }),
    );

    const loaded = loadDraft(storage);
    expect(loaded?.template.pageSize).toBe('letter');
    expect(loaded?.template.format.fontSize).toBe('standard');
  });
});
