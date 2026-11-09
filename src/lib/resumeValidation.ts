import type { Resume } from '../types/resume';

/** True when at least one enabled section carries usable content. */
export function resumeHasContent(resume: Resume): boolean {
  return resume.sections.some(
    (section) =>
      section.enabled &&
      section.items.some(
        (item) =>
          Boolean(item.title || item.subtitle || item.body || item.dateRange || item.location) ||
          item.bullets.length > 0,
      ),
  );
}
