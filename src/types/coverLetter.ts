import type { Contact, ResumeTemplate } from './resume';

export interface CoverLetterApplicant {
  name: string;
  headline?: string;
  contact: Contact;
}

export interface CoverLetter {
  schemaVersion: 1;
  applicant: CoverLetterApplicant;
  date: string;
  recipient: string[];
  position: string;
  salutation: string;
  body: string[];
  closing: string;
  signature: string;
  template: ResumeTemplate;
}

export interface CoverLetterParseResult {
  coverLetter: CoverLetter;
  warnings: string[];
  documentCount: number;
}
