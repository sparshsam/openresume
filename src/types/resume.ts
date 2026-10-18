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

export type PageSize = 'letter' | 'a4' | 'legal';
export type MarginPreset = 'narrow' | 'normal' | 'wide';
export type FontSizePreset = 'small' | 'standard' | 'large';
export type SpacingPreset = 'compact' | 'standard' | 'relaxed';
export type ColumnSpacingPreset = 'narrow' | 'standard' | 'wide';
export type DensityPreset = 'compact' | 'balanced' | 'spacious';

export interface FormatSettings {
  margins: MarginPreset;
  fontSize: FontSizePreset;
  lineSpacing: SpacingPreset;
  sectionSpacing: SpacingPreset;
  paragraphSpacing: SpacingPreset;
  bulletSpacing: SpacingPreset;
  columnSpacing: ColumnSpacingPreset;
  density: DensityPreset;
}

export const DEFAULT_FORMAT: FormatSettings = {
  margins: 'normal',
  fontSize: 'standard',
  lineSpacing: 'standard',
  sectionSpacing: 'standard',
  paragraphSpacing: 'standard',
  bulletSpacing: 'standard',
  columnSpacing: 'standard',
  density: 'balanced',
};

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
  pageSize: PageSize;
  accent: string;
  format: FormatSettings;
}

export const DEFAULT_TEMPLATE: ResumeTemplate = {
  pageSize: 'letter',
  accent: '#14532D',
  format: DEFAULT_FORMAT,
};

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
  documentCount: number;
}
