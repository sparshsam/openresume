import { LIST_KINDS } from './parse';
import type { Resume, ResumeItem, ResumeSection } from '../types/resume';

function contactLine(resume: Resume): string {
  const parts = [
    resume.header.headline,
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    ...resume.contact.links.map((link) => link.label),
  ].filter((part): part is string => Boolean(part && part.trim()));
  return parts.join(' | ');
}

function metadataLine(item: ResumeItem): string | null {
  if (item.dateRange && item.location) return `${item.dateRange} | ${item.location}`;
  if (item.dateRange) return item.dateRange;
  if (item.location) return item.location;
  return null;
}

function serializeItem(section: ResumeSection, item: ResumeItem): string[] {
  const lines: string[] = [];

  if (section.kind === 'skills') {
    if (item.title && item.subtitle) {
      lines.push(`${item.title}: ${item.subtitle}`);
    } else if (item.title || item.body) {
      lines.push(item.title ?? item.body ?? '');
    }
    return lines;
  }

  if (LIST_KINDS.has(section.kind)) {
    if (item.body) lines.push(`- ${item.body}`);
    for (const bullet of item.bullets) lines.push(`- ${bullet}`);
    return lines;
  }

  if (item.title) {
    lines.push(`### ${item.title}${item.subtitle ? ` — ${item.subtitle}` : ''}`);
  }
  const meta = metadataLine(item);
  if (meta) lines.push(meta);
  if (item.body) lines.push(item.body);
  for (const bullet of item.bullets) lines.push(`- ${bullet}`);
  return lines;
}

export function serializeResume(resume: Resume): string {
  const blocks: string[] = [];

  const headerParts = [`# ${resume.header.name}`.trimEnd()];
  const contact = contactLine(resume);
  if (contact) headerParts.push(contact);
  blocks.push(headerParts.join('\n'));

  for (const section of resume.sections) {
    const lines = [`## ${section.title}`];
    for (const item of section.items) {
      const itemLines = serializeItem(section, item).filter((line) => line.trim().length > 0);
      if (itemLines.length > 0) lines.push(...itemLines);
    }
    blocks.push(lines.join('\n'));
  }

  return `${blocks.join('\n\n')}\n`;
}
