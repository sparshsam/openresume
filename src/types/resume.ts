export type SectionKind =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'custom';

export type ColumnId = 'main' | 'side';

export interface ContactLink {
  label: string;
  url: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  location?: string;
  links: ContactLink[];
}

export interface ResumeHeader {
  name: string;
  headline?: string;
}

export interface ResumeItem {
  id: string;
  title?: string;
  subtitle?: string;
  dateRange?: string;
  location?: string;
  bullets: string[];
  body?: string;
}

export interface ResumeSection {
  id: string;
  kind: SectionKind;
  title: string;
  column: ColumnId;
  enabled: boolean;
  items: ResumeItem[];
}

export interface ResumeTemplate {
  pageSize: 'a4';
  accent: string;
}

export interface Resume {
  schemaVersion: 1;
  header: ResumeHeader;
  contact: Contact;
  sections: ResumeSection[];
  template: ResumeTemplate;
}

export interface ParseResult {
  resume: Resume;
  warnings: string[];
}
