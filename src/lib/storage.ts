import type { CoverLetter } from '../types/coverLetter';
import type { Resume } from '../types/resume';

/** Keys used by v0.1.0–v0.1.4. They are removed once their contents are identified. */
export const DRAFT_KEY = 'openresume:draft.v1';
export const COVER_LETTER_DRAFT_KEY = 'openresume:cover-letter.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isResume(value: unknown): value is Resume {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1) return false;
  if (!isRecord(value.header) || typeof value.header.name !== 'string') return false;
  if (!isRecord(value.contact)) return false;
  if (!Array.isArray(value.sections)) return false;
  if (value.template !== undefined && !isRecord(value.template)) return false;
  return value.sections.every(
    (section) =>
      isRecord(section) &&
      typeof section.id === 'string' &&
      typeof section.kind === 'string' &&
      typeof section.title === 'string' &&
      (section.column === 'main' || section.column === 'side') &&
      typeof section.enabled === 'boolean' &&
      Array.isArray(section.items),
  );
}

export function isCoverLetter(value: unknown): value is CoverLetter {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1) return false;
  if (!isRecord(value.applicant) || typeof value.applicant.name !== 'string') return false;
  if (!isRecord(value.applicant.contact)) return false;
  if (typeof value.date !== 'string') return false;
  if (!Array.isArray(value.recipient)) return false;
  if (typeof value.position !== 'string') return false;
  if (typeof value.salutation !== 'string') return false;
  if (!Array.isArray(value.body) || !value.body.every((line) => typeof line === 'string')) {
    return false;
  }
  if (typeof value.closing !== 'string') return false;
  if (typeof value.signature !== 'string') return false;
  if (value.template !== undefined && !isRecord(value.template)) return false;
  return true;
}

function clearIdentifiedEntry(
  key: string,
  isDocument: (value: unknown) => boolean,
  storage: Storage,
): void {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return;
    const parsed: unknown = JSON.parse(raw);
    if (isDocument(parsed)) storage.removeItem(key);
  } catch {
    // Leave unreadable values untouched rather than removing something we cannot identify.
  }
}

/**
 * Removes drafts written by earlier releases. Storage is otherwise unused; the
 * theme preference is owned by the theme module and is not touched here.
 */
export function clearLegacyDrafts(storage: Storage = localStorage): void {
  clearIdentifiedEntry(DRAFT_KEY, isResume, storage);
  clearIdentifiedEntry(COVER_LETTER_DRAFT_KEY, isCoverLetter, storage);
}
