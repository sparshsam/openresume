import type { DocumentKind } from '../types/document';

export function documentFilename(
  name: string,
  kind: DocumentKind,
  extension: 'pdf' | 'docx',
): string {
  const base = name
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = kind === 'resume' ? 'Resume' : 'Cover-Letter';
  const fallback = kind === 'resume' ? 'Resume' : 'Document';
  return `${base || fallback}-${suffix}.${extension}`;
}

export function resumeFilename(name: string, extension: 'pdf' | 'docx'): string {
  return documentFilename(name, 'resume', extension);
}
