import { stripEnclosingCodeFence } from './codeFence';
import { parseContactLine } from './contact';
import {
  DEFAULT_FORMAT,
  DEFAULT_TEMPLATE,
  type ColumnId,
  type ParseResult,
  type Resume,
  type ResumeItem,
  type ResumeSection,
  type SectionKind,
} from '../types/resume';

export const RESUME_SECTION_ALIASES: Record<string, SectionKind> = {
  summary: 'summary',
  objective: 'summary',
  profile: 'summary',
  about: 'summary',
  'professional summary': 'summary',
  experience: 'experience',
  'work experience': 'experience',
  employment: 'experience',
  'work history': 'experience',
  'professional experience': 'experience',
  education: 'education',
  'academic background': 'education',
  skills: 'skills',
  'technical skills': 'skills',
  'core skills': 'skills',
  expertise: 'skills',
  projects: 'projects',
  'selected projects': 'projects',
  'personal projects': 'projects',
  certifications: 'certifications',
  certificates: 'certifications',
  licenses: 'certifications',
  awards: 'awards',
  honors: 'awards',
  achievements: 'awards',
  languages: 'languages',
  volunteer: 'volunteer',
  volunteering: 'volunteer',
  community: 'volunteer',
  'volunteer experience': 'volunteer',
  interests: 'interests',
  hobbies: 'interests',
};

export const RESUME_SECTION_TITLES: Record<SectionKind, string> = {
  summary: 'SUMMARY',
  experience: 'EXPERIENCE',
  education: 'EDUCATION',
  skills: 'SKILLS',
  projects: 'PROJECTS',
  certifications: 'CERTIFICATIONS',
  awards: 'AWARDS',
  languages: 'LANGUAGES',
  volunteer: 'VOLUNTEER',
  interests: 'INTERESTS',
  custom: '',
};

const DEFAULT_COLUMN: Record<SectionKind, ColumnId> = {
  summary: 'main',
  experience: 'main',
  education: 'side',
  skills: 'side',
  projects: 'main',
  certifications: 'side',
  awards: 'side',
  languages: 'side',
  volunteer: 'main',
  interests: 'side',
  custom: 'main',
};

export const LIST_KINDS = new Set<SectionKind>([
  'certifications',
  'awards',
  'languages',
  'interests',
]);

const DATE_RE =
  /\b(19|20)\d{2}\b|\bpresent\b|\bcurrent\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i;

function isMetadataLine(line: string): boolean {
  return line.includes('|') || DATE_RE.test(line);
}

function normalizeHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function kindForTitle(title: string): SectionKind {
  return RESUME_SECTION_ALIASES[normalizeHeading(title)] ?? 'custom';
}

function splitTitle(raw: string): { title: string; subtitle?: string } {
  for (const separator of [' — ', ' – ', ' - ']) {
    const index = raw.indexOf(separator);
    if (index > 0) {
      const title = raw.slice(0, index).trim();
      const subtitle = raw.slice(index + separator.length).trim();
      if (subtitle) return { title, subtitle: subtitle || undefined };
    }
  }
  return { title: raw.trim() };
}

function emptyResume(): Resume {
  return {
    schemaVersion: 1,
    header: { name: '' },
    contact: { links: [] },
    sections: [],
    template: {
      ...DEFAULT_TEMPLATE,
      format: { ...DEFAULT_FORMAT },
    },
  };
}

export function parseResume(input: string): ParseResult {
  const warnings: string[] = [];
  const resume = emptyResume();
  const normalized = stripEnclosingCodeFence(input);
  const lines = normalized.replace(/\r\n?/g, '\n').split('\n');

  let awaitingContact = false;
  let sawContactLine = false;
  let currentSection: ResumeSection | null = null;
  let currentItem: ResumeItem | null = null;
  let lastWasBullet = false;
  let sectionIndex = 0;
  let documentCount = 0;

  const pushSection = (kind: SectionKind, title: string): ResumeSection => {
    const section: ResumeSection = {
      id: `sec-${sectionIndex}`,
      kind,
      title: kind === 'custom' ? title.trim() || 'CUSTOM' : RESUME_SECTION_TITLES[kind],
      column: DEFAULT_COLUMN[kind],
      enabled: true,
      items: [],
    };
    sectionIndex += 1;
    resume.sections.push(section);
    return section;
  };

  const pushItem = (section: ResumeSection, item: Omit<ResumeItem, 'id'>): ResumeItem => {
    const created: ResumeItem = {
      id: `item-${section.id.replace('sec-', '')}-${section.items.length}`,
      ...item,
    };
    section.items.push(created);
    return created;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      lastWasBullet = false;
      continue;
    }

    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      const name = trimmed.slice(2).trim();
      documentCount += 1;
      if (!resume.header.name) {
        resume.header.name = name;
        awaitingContact = true;
      } else {
        warnings.push(
          `Found an additional resume heading: "${name}". Import one resume at a time.`,
        );
      }
      currentSection = null;
      currentItem = null;
      lastWasBullet = false;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const title = trimmed.slice(3).trim();
      const kind = kindForTitle(title);
      currentSection = pushSection(kind, title);
      currentItem = null;
      lastWasBullet = false;
      awaitingContact = false;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      if (!currentSection) {
        warnings.push('Found an item before any section; created an ADDITIONAL section.');
        currentSection = pushSection('custom', 'ADDITIONAL');
      }
      const parsed = splitTitle(trimmed.slice(4).trim());
      currentItem = pushItem(currentSection, {
        title: parsed.title,
        subtitle: parsed.subtitle,
        bullets: [],
      });
      lastWasBullet = false;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, '').trim();
      if (!currentSection) {
        warnings.push('Found a bullet before any section; created an ADDITIONAL section.');
        currentSection = pushSection('custom', 'ADDITIONAL');
      }
      if (LIST_KINDS.has(currentSection.kind)) {
        if (currentItem) {
          currentItem.body = currentItem.body ? `${currentItem.body} ${text}` : text;
        } else {
          pushItem(currentSection, { body: text, bullets: [] });
        }
      } else if (currentItem) {
        currentItem.bullets.push(text);
      } else {
        currentItem = pushItem(currentSection, { bullets: [text] });
      }
      lastWasBullet = true;
      continue;
    }

    if (awaitingContact && !sawContactLine) {
      const parsedContact = parseContactLine(trimmed);
      if (parsedContact.headline) resume.header.headline = parsedContact.headline;
      resume.contact = parsedContact.contact;
      sawContactLine = true;
      awaitingContact = false;
      continue;
    }

    if (!currentSection) {
      currentSection = pushSection('summary', 'SUMMARY');
    }

    if (
      currentItem &&
      !lastWasBullet &&
      !currentItem.dateRange &&
      !currentItem.body &&
      currentItem.bullets.length === 0 &&
      isMetadataLine(trimmed)
    ) {
      const parts = trimmed
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        currentItem.dateRange = parts[0];
        currentItem.location = parts.slice(1).join(' | ');
      } else if (DATE_RE.test(parts[0])) {
        currentItem.dateRange = parts[0];
      } else {
        currentItem.location = parts[0];
      }
      continue;
    }

    if (currentSection.kind === 'skills') {
      const colon = trimmed.indexOf(':');
      if (colon > 0 && colon <= 48) {
        pushItem(currentSection, {
          title: trimmed.slice(0, colon).trim(),
          subtitle: trimmed.slice(colon + 1).trim(),
          bullets: [],
        });
        currentItem = null;
        lastWasBullet = false;
        continue;
      }
    }

    if (currentItem) {
      if (lastWasBullet && currentItem.bullets.length > 0) {
        const last = currentItem.bullets.length - 1;
        currentItem.bullets[last] = `${currentItem.bullets[last]} ${trimmed}`;
      } else {
        currentItem.body = currentItem.body ? `${currentItem.body} ${trimmed}` : trimmed;
      }
    } else {
      const last = currentSection.items[currentSection.items.length - 1];
      if (last && !last.title && !last.subtitle && last.bullets.length === 0) {
        last.body = last.body ? `${last.body} ${trimmed}` : trimmed;
      } else {
        pushItem(currentSection, { body: trimmed, bullets: [] });
      }
    }
    lastWasBullet = false;
  }

  if (!normalized.trim()) {
    warnings.push('No content found. Start with "# Your Name".');
  } else if (!resume.header.name) {
    warnings.push('No name found. Start with "# Your Name".');
  }

  return { resume, warnings, documentCount };
}
