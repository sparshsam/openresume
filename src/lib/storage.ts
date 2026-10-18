import { normalizeTemplate } from './normalize';
import type { CoverLetter } from '../types/coverLetter';
import type { Resume } from '../types/resume';

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

export function loadDraft(storage: Storage = localStorage): Resume | null {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isResume(parsed)) return null;
    return { ...parsed, template: normalizeTemplate(parsed.template) };
  } catch {
    return null;
  }
}

export function saveDraft(resume: Resume, storage: Storage = localStorage): void {
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify(resume));
  } catch {
    // Storage can be unavailable (private mode, quota). Drafts are a convenience.
  }
}

export function clearDraft(storage: Storage = localStorage): void {
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore unavailable storage.
  }
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

export function normalizeCoverLetter(value: unknown): CoverLetter | null {
  if (!isCoverLetter(value)) return null;

  const applicant = value.applicant as CoverLetter['applicant'];
  const contact = applicant.contact;

  return {
    schemaVersion: 1,
    applicant: {
      name: applicant.name,
      headline: typeof applicant.headline === 'string' ? applicant.headline : undefined,
      contact: {
        email: typeof contact.email === 'string' ? contact.email : undefined,
        phone: typeof contact.phone === 'string' ? contact.phone : undefined,
        location: typeof contact.location === 'string' ? contact.location : undefined,
        links: Array.isArray(contact.links)
          ? contact.links.filter(
              (link): link is { label: string; url: string } =>
                isRecord(link) && typeof link.label === 'string' && typeof link.url === 'string',
            )
          : [],
      },
    },
    date: value.date,
    recipient: value.recipient.filter((line): line is string => typeof line === 'string'),
    position: value.position,
    salutation: value.salutation,
    body: value.body.filter((line): line is string => typeof line === 'string'),
    closing: value.closing,
    signature: value.signature,
    template: normalizeTemplate(value.template),
  };
}

export function loadCoverLetterDraft(storage: Storage = localStorage): CoverLetter | null {
  try {
    const raw = storage.getItem(COVER_LETTER_DRAFT_KEY);
    if (!raw) return null;
    return normalizeCoverLetter(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveCoverLetterDraft(
  coverLetter: CoverLetter,
  storage: Storage = localStorage,
): void {
  try {
    storage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify(coverLetter));
  } catch {
    // Storage can be unavailable (private mode, quota). Drafts are a convenience.
  }
}

export function clearCoverLetterDraft(storage: Storage = localStorage): void {
  try {
    storage.removeItem(COVER_LETTER_DRAFT_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
