import type { DocumentKind } from '../types/document';

function sanitizeName(name: string): string {
  return name
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function documentFilename(
  name: string,
  kind: DocumentKind,
  extension: 'pdf' | 'docx',
): string {
  const base = sanitizeName(name);
  const suffix = kind === 'resume' ? 'Resume' : 'Cover-Letter';
  const fallback = kind === 'resume' ? 'Resume' : 'Document';
  return `${base || fallback}-${suffix}.${extension}`;
}

export function applicationKitFilename(name: string, extension: 'pdf' | 'docx'): string {
  const base = sanitizeName(name);
  return `${base || 'Application'}-Application-Kit.${extension}`;
}

export function resumeFilename(name: string, extension: 'pdf' | 'docx'): string {
  return documentFilename(name, 'resume', extension);
}
