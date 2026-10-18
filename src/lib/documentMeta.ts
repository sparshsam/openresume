import type { DocumentKind } from '../types/document';
import type { Resume } from '../types/resume';
import type { CoverLetter } from '../types/coverLetter';

export interface DocumentMeta {
  kind: DocumentKind;
  name: string;
  headline?: string;
  subject?: string;
}

export function resumeMeta(resume: Resume): DocumentMeta {
  return {
    kind: 'resume',
    name: resume.header.name,
    headline: resume.header.headline,
  };
}

export function coverLetterMeta(letter: CoverLetter): DocumentMeta {
  return {
    kind: 'coverLetter',
    name: letter.applicant.name,
    headline: letter.applicant.headline,
    subject: letter.position || 'Cover Letter',
  };
}
