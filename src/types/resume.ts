import { DEFAULT_DOCUMENT_ACCENT } from '../lib/tokens';

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

export type ResumeLayoutId =
  | 'twoColumn'
  | 'atsSimple'
  | 'executive'
  | 'modernMinimal'
  | 'classic'
  | 'creative'
  | 'compact'
  | 'academic'
  | 'contemporary'
  | 'bold';

export type CoverLetterStyleId = 'classic' | 'modern' | 'executive' | 'minimal';

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
  /** Starts this section on a fresh page. Automatic pagination remains the default. */
  startOnNewPage: boolean;
  items: ResumeItem[];
}

export interface PaginationSettings {
  /** Move a whole entry to the next page when it fits there, instead of splitting it. */
  keepEntriesTogether: boolean;
}

export const DEFAULT_PAGINATION: PaginationSettings = {
  keepEntriesTogether: true,
};

export interface ResumeTemplate {
  pageSize: PageSize;
  accent: string;
  layout: ResumeLayoutId;
  /** Cover letters use their own style list; the resume design only suggests one. */
  letterStyle: CoverLetterStyleId;
  pagination: PaginationSettings;
  format: FormatSettings;
}

export const DEFAULT_TEMPLATE: ResumeTemplate = {
  pageSize: 'letter',
  accent: DEFAULT_DOCUMENT_ACCENT,
  layout: 'twoColumn',
  letterStyle: 'classic',
  pagination: { ...DEFAULT_PAGINATION },
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
