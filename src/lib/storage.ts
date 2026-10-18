import { normalizeTemplate } from './normalize';
import type { Resume } from '../types/resume';

export const DRAFT_KEY = 'openresume:draft.v1';

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
