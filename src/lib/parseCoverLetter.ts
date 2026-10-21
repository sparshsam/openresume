import { stripEnclosingCodeFence } from './codeFence';
import { parseContactLine } from './contact';
import { DEFAULT_FORMAT, DEFAULT_TEMPLATE } from '../types/resume';
import type { CoverLetter, CoverLetterParseResult } from '../types/coverLetter';

export type CoverLetterSection =
  'DATE' | 'RECIPIENT' | 'POSITION' | 'SALUTATION' | 'BODY' | 'CLOSING' | 'SIGNATURE';

export const COVER_LETTER_SECTION_ALIASES: Record<string, CoverLetterSection> = {
  date: 'DATE',
  recipient: 'RECIPIENT',
  'recipient details': 'RECIPIENT',
  'recipient address': 'RECIPIENT',
  addressee: 'RECIPIENT',
  position: 'POSITION',
  role: 'POSITION',
  subject: 'POSITION',
  re: 'POSITION',
  'position applied for': 'POSITION',
  'job title': 'POSITION',
  salutation: 'SALUTATION',
  greeting: 'SALUTATION',
  body: 'BODY',
  letter: 'BODY',
  content: 'BODY',
  message: 'BODY',
  closing: 'CLOSING',
  'sign-off': 'CLOSING',
  'sign off': 'CLOSING',
  signature: 'SIGNATURE',
  signed: 'SIGNATURE',
};

function normalizeHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[:\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function emptyCoverLetter(): CoverLetter {
  return {
    schemaVersion: 1,
    applicant: { name: '', contact: { links: [] } },
    date: '',
    recipient: [],
    position: '',
    salutation: '',
    body: [],
    closing: '',
    signature: '',
    template: {
      ...DEFAULT_TEMPLATE,
      format: { ...DEFAULT_FORMAT },
    },
  };
}

function joinNonEmpty(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
}

function splitParagraphs(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      paragraphs.push(current.join(' ').trim());
      current = [];
    }
  };

  for (const line of lines) {
    if (!line.trim()) {
      flush();
    } else {
      current.push(line.trim());
    }
  }
  flush();

  return paragraphs.filter(Boolean);
}

export function parseCoverLetter(input: string): CoverLetterParseResult {
  const warnings: string[] = [];
  const coverLetter = emptyCoverLetter();
  const coverLetterSections: Record<CoverLetterSection, string[]> = {
    DATE: [],
    RECIPIENT: [],
    POSITION: [],
    SALUTATION: [],
    BODY: [],
    CLOSING: [],
    SIGNATURE: [],
  };
  const unknownLines: string[] = [];
  const unknownTitles: string[] = [];
  const normalized = stripEnclosingCodeFence(input);
  const lines = normalized.replace(/\r\n?/g, '\n').split('\n');

  let awaitingContact = false;
  let sawContactLine = false;
  let currentSection: CoverLetterSection | null = null;
  let inUnknownSection = false;
  let warnedPreSection = false;
  let documentCount = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      const name = trimmed.slice(2).trim();
      documentCount += 1;
      if (!coverLetter.applicant.name) {
        coverLetter.applicant.name = name;
        awaitingContact = true;
      } else {
        warnings.push(
          `Found an additional cover letter heading: "${name}". Import one letter at a time.`,
        );
      }
      currentSection = null;
      inUnknownSection = false;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const title = trimmed.slice(3).trim();
      const section = COVER_LETTER_SECTION_ALIASES[normalizeHeading(title)];
      awaitingContact = false;
      if (section) {
        currentSection = section;
        inUnknownSection = false;
      } else {
        currentSection = null;
        inUnknownSection = true;
        unknownTitles.push(title);
        warnings.push(`Unknown cover letter section "${title}" was appended to the body.`);
      }
      continue;
    }

    if (awaitingContact && !sawContactLine && trimmed) {
      const parsed = parseContactLine(trimmed);
      coverLetter.applicant.contact = parsed.contact;
      if (parsed.headline) coverLetter.applicant.headline = parsed.headline;
      sawContactLine = true;
      awaitingContact = false;
      continue;
    }

    if (!trimmed) {
      if (currentSection) coverLetterSections[currentSection].push('');
      else if (inUnknownSection) unknownLines.push('');
      continue;
    }

    if (inUnknownSection) {
      unknownLines.push(trimmed);
      continue;
    }

    if (currentSection) {
      coverLetterSections[currentSection].push(trimmed);
      continue;
    }

    if (!warnedPreSection) {
      warnings.push('Text before the first cover letter section was treated as body content.');
      warnedPreSection = true;
    }
    coverLetterSections.BODY.push(trimmed);
  }

  coverLetter.date = joinNonEmpty(coverLetterSections.DATE);
  coverLetter.recipient = coverLetterSections.RECIPIENT.map((line) => line.trim()).filter(Boolean);
  coverLetter.position = joinNonEmpty(coverLetterSections.POSITION);
  coverLetter.salutation = joinNonEmpty(coverLetterSections.SALUTATION);
  coverLetter.body = splitParagraphs(coverLetterSections.BODY);
  coverLetter.closing = joinNonEmpty(coverLetterSections.CLOSING);
  coverLetter.signature = joinNonEmpty(coverLetterSections.SIGNATURE);

  if (unknownLines.some((line) => line.trim())) {
    coverLetter.body.push(...splitParagraphs(unknownLines));
    if (unknownTitles.length > 0) {
      warnings.push(`Preserved content from unknown sections: ${unknownTitles.join(', ')}.`);
    }
  }

  if (!normalized.trim()) {
    warnings.push('No content found. Start with "# Your Name".');
  } else if (!coverLetter.applicant.name) {
    warnings.push('No name found. Start with "# Your Name".');
  }
  if (coverLetter.body.length === 0) {
    warnings.push('Add a BODY section with at least one paragraph.');
  }

  return { coverLetter, warnings, documentCount };
}
