export function resumeFilename(name: string, extension: 'pdf' | 'docx'): string {
  const base = name
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'Resume'}-Resume.${extension}`;
}
