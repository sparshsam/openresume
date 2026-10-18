import type { Resume } from '../types/resume';

export function buildCoverLetterScaffold(resume: Resume): string {
  const name = resume.header.name;
  const contact = [
    resume.header.headline,
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    ...resume.contact.links.map((link) => link.label),
  ]
    .filter(Boolean)
    .join(' | ');

  const lines = [`# ${name}`];
  if (contact) lines.push(contact);
  lines.push(
    '',
    '## DATE',
    '',
    '## RECIPIENT',
    '',
    '## POSITION',
    '',
    '## SALUTATION',
    '',
    '## BODY',
    '',
    '## CLOSING',
    '',
    '## SIGNATURE',
  );
  if (name) lines.push(name);

  return `${lines.join('\n').trimEnd()}\n`;
}
