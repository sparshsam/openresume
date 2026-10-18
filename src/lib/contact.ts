import type { Contact } from '../types/resume';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d][\d\s().-]{6,}$/;
const URL_RE = /^(https?:\/\/|www\.)/i;
const BARE_URL_RE = /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i;

function toUrl(value: string): string {
  return URL_RE.test(value) ? value : `https://${value}`;
}

export interface ParsedContactLine {
  headline?: string;
  contact: Contact;
}

export function parseContactLine(line: string): ParsedContactLine {
  const contact: Contact = { links: [] };
  let headline: string | undefined;
  let sawContactDetail = false;

  const parts = line
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (!contact.email && EMAIL_RE.test(part)) {
      contact.email = part;
      sawContactDetail = true;
      continue;
    }
    if (!contact.phone && PHONE_RE.test(part)) {
      contact.phone = part;
      sawContactDetail = true;
      continue;
    }
    if (URL_RE.test(part) || BARE_URL_RE.test(part)) {
      contact.links.push({ label: part.replace(/^https?:\/\//i, ''), url: toUrl(part) });
      sawContactDetail = true;
      continue;
    }
    if (!headline && !sawContactDetail) {
      headline = part;
      continue;
    }
    if (!contact.location) {
      contact.location = part;
      continue;
    }
    if (!headline) {
      headline = part;
    }
  }

  return { headline, contact };
}
