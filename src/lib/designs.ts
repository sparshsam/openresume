import type { CoverLetterStyleId, ResumeLayoutId } from '../types/resume';
import type { FontFamily } from './measure';

export type ApplicationContextId =
  'government' | 'corporate' | 'technology' | 'creative' | 'experienced';

export interface ApplicationContext {
  id: ApplicationContextId;
  label: string;
  recommended: ResumeLayoutId[];
}

export const APPLICATION_CONTEXTS: ApplicationContext[] = [
  {
    id: 'government',
    label: 'Government or legal',
    recommended: ['classic', 'atsSimple'],
  },
  {
    id: 'corporate',
    label: 'Corporate or management',
    recommended: ['executive', 'twoColumn'],
  },
  {
    id: 'technology',
    label: 'Technology or business',
    recommended: ['modernMinimal', 'contemporary'],
  },
  {
    id: 'creative',
    label: 'Creative or marketing',
    recommended: ['creative', 'bold'],
  },
  {
    id: 'experienced',
    label: 'Experienced professional',
    recommended: ['compact'],
  },
];

export interface HeaderDesign {
  align: 'left' | 'center';
  nameScale: number;
  nameLetterSpacingPt: number;
  nameColor: 'accent' | 'text';
  headlineScale: number;
  showRule: boolean;
  ruleWidthPt: number;
  ruleColor: 'accent' | 'text' | 'muted';
  ruleGapPt: number;
  contactJoin: string;
}

export interface HeadingDesign {
  transform: 'upper' | 'title';
  scale: number;
  letterSpacingPt: number;
  color: 'accent' | 'text';
  rule: 'none' | 'line' | 'thick';
  ruleWidthPt: number;
  ruleColor: 'accent' | 'text' | 'muted';
  beforeScale: number;
  afterScale: number;
}

export interface BodyDesign {
  scale: number;
  lineScale: number;
  bulletChar: string;
  metaScale: number;
  itemBeforeScale: number;
  paragraphAfterScale: number;
  bulletAfterScale: number;
}

export interface ResumeDesignTraits {
  columns: 1 | 2;
  fontFamily: FontFamily;
  header: HeaderDesign;
  heading: HeadingDesign;
  body: BodyDesign;
}

export interface ResumeDesign extends ResumeDesignTraits {
  id: ResumeLayoutId;
  name: string;
  description: string;
  suggestedLetterStyle: CoverLetterStyleId;
}

export interface CoverLetterStyleTraits {
  fontFamily: FontFamily;
  header: HeaderDesign;
  body: {
    scale: number;
    lineScale: number;
  };
  subject: {
    color: 'text' | 'accent';
    uppercase: boolean;
  };
  signature: {
    bold: boolean;
  };
}

export interface CoverLetterStyle extends CoverLetterStyleTraits {
  id: CoverLetterStyleId;
  name: string;
  description: string;
}

const IDENTITY_HEADER: HeaderDesign = {
  align: 'left',
  nameScale: 1,
  nameLetterSpacingPt: 0,
  nameColor: 'accent',
  headlineScale: 1,
  showRule: true,
  ruleWidthPt: 1.2,
  ruleColor: 'accent',
  ruleGapPt: 10,
  contactJoin: '  ·  ',
};

const IDENTITY_HEADING: HeadingDesign = {
  transform: 'upper',
  scale: 1,
  letterSpacingPt: 0,
  color: 'accent',
  rule: 'none',
  ruleWidthPt: 0,
  ruleColor: 'accent',
  beforeScale: 1,
  afterScale: 1,
};

const IDENTITY_BODY: BodyDesign = {
  scale: 1,
  lineScale: 1,
  bulletChar: '•',
  metaScale: 1,
  itemBeforeScale: 1,
  paragraphAfterScale: 1,
  bulletAfterScale: 1,
};

export const RESUME_DESIGNS: ResumeDesign[] = [
  {
    id: 'twoColumn',
    name: 'Professional Two-Column',
    description: 'The original balanced main-and-side layout.',
    columns: 2,
    fontFamily: 'helvetica',
    header: { ...IDENTITY_HEADER },
    heading: { ...IDENTITY_HEADING },
    body: { ...IDENTITY_BODY },
    suggestedLetterStyle: 'classic',
  },
  {
    id: 'atsSimple',
    name: 'ATS Simple',
    description: 'One linear column with plain, conventional section headings.',
    columns: 1,
    fontFamily: 'helvetica',
    header: { ...IDENTITY_HEADER },
    heading: { ...IDENTITY_HEADING },
    body: { ...IDENTITY_BODY },
    suggestedLetterStyle: 'minimal',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Serif typography, a centered header, and restrained rules.',
    columns: 1,
    fontFamily: 'times',
    header: {
      ...IDENTITY_HEADER,
      align: 'center',
      nameScale: 1.14,
      nameLetterSpacingPt: 1.1,
      headlineScale: 1.02,
      ruleWidthPt: 0.6,
      ruleGapPt: 12,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 0.98,
      letterSpacingPt: 1.6,
      beforeScale: 1.1,
      afterScale: 1.1,
    },
    body: {
      ...IDENTITY_BODY,
      lineScale: 1.06,
      metaScale: 0.98,
      itemBeforeScale: 1.05,
      paragraphAfterScale: 1.05,
      bulletAfterScale: 1.1,
    },
    suggestedLetterStyle: 'executive',
  },
  {
    id: 'modernMinimal',
    name: 'Modern Minimal',
    description: 'Quiet sans-serif headings with generous whitespace.',
    columns: 1,
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      nameScale: 1.08,
      nameLetterSpacingPt: 0.6,
      showRule: false,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 0.92,
      letterSpacingPt: 1.3,
      color: 'text',
      beforeScale: 1.35,
      afterScale: 1.2,
    },
    body: {
      ...IDENTITY_BODY,
      lineScale: 1.03,
      itemBeforeScale: 1.1,
      paragraphAfterScale: 1.1,
    },
    suggestedLetterStyle: 'modern',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional serif formatting with a centered identity block.',
    columns: 1,
    fontFamily: 'times',
    header: {
      ...IDENTITY_HEADER,
      align: 'center',
      nameScale: 1.02,
      nameLetterSpacingPt: 0.4,
      ruleWidthPt: 0.6,
      ruleColor: 'text',
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 0.96,
      letterSpacingPt: 0.8,
      color: 'text',
      beforeScale: 1.05,
    },
    body: {
      ...IDENTITY_BODY,
      lineScale: 1.04,
    },
    suggestedLetterStyle: 'classic',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'A strong accent rule, expressive headings, and a two-column flow.',
    columns: 2,
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      nameScale: 1.32,
      showRule: true,
      ruleWidthPt: 3,
      ruleGapPt: 9,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 1.06,
      letterSpacingPt: 1.4,
      rule: 'thick',
      ruleWidthPt: 2.2,
      beforeScale: 1.15,
      afterScale: 1.1,
    },
    body: {
      ...IDENTITY_BODY,
      bulletChar: '–',
      itemBeforeScale: 1.1,
    },
    suggestedLetterStyle: 'modern',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Space-efficient two-column formatting that stays readable.',
    columns: 2,
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      nameScale: 0.96,
      ruleWidthPt: 0.8,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 0.94,
      letterSpacingPt: 0.4,
      beforeScale: 0.7,
      afterScale: 0.75,
    },
    body: {
      ...IDENTITY_BODY,
      scale: 0.92,
      lineScale: 0.94,
      metaScale: 0.94,
      itemBeforeScale: 0.75,
      paragraphAfterScale: 0.8,
      bulletAfterScale: 0.8,
    },
    suggestedLetterStyle: 'minimal',
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Serif text with understated headings for research and publications.',
    columns: 1,
    fontFamily: 'times',
    header: {
      ...IDENTITY_HEADER,
      showRule: false,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 0.95,
      letterSpacingPt: 0.9,
      color: 'text',
      rule: 'line',
      ruleWidthPt: 0.6,
      ruleColor: 'text',
      afterScale: 0.9,
    },
    body: {
      ...IDENTITY_BODY,
      lineScale: 1.03,
    },
    suggestedLetterStyle: 'classic',
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    description: 'Centered header, accent rules, and lightly treated section headings.',
    columns: 1,
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      align: 'center',
      nameScale: 1.12,
      nameLetterSpacingPt: 1.4,
      ruleWidthPt: 2,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 0.95,
      letterSpacingPt: 1.2,
      rule: 'line',
      ruleWidthPt: 0.5,
      beforeScale: 1.2,
      afterScale: 1.05,
    },
    body: {
      ...IDENTITY_BODY,
      lineScale: 1.02,
    },
    suggestedLetterStyle: 'modern',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Oversized identity, heavy rules, and confident headings.',
    columns: 2,
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      nameScale: 1.42,
      ruleWidthPt: 4,
      ruleGapPt: 8,
    },
    heading: {
      ...IDENTITY_HEADING,
      scale: 1.1,
      letterSpacingPt: 1.8,
      rule: 'thick',
      ruleWidthPt: 3,
      beforeScale: 1.2,
      afterScale: 1.1,
    },
    body: {
      ...IDENTITY_BODY,
      scale: 1.02,
      lineScale: 1.02,
      itemBeforeScale: 1.15,
    },
    suggestedLetterStyle: 'modern',
  },
];

export const COVER_LETTER_STYLES: CoverLetterStyle[] = [
  {
    id: 'classic',
    name: 'Classic Letter',
    description: 'The original format: sans-serif, left-aligned, with an accent rule.',
    fontFamily: 'helvetica',
    header: { ...IDENTITY_HEADER },
    body: { scale: 1, lineScale: 1 },
    subject: { color: 'text', uppercase: false },
    signature: { bold: true },
  },
  {
    id: 'modern',
    name: 'Modern Letter',
    description: 'A larger name, no header rule, and an accent subject line.',
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      nameScale: 1.12,
      nameLetterSpacingPt: 0.6,
      showRule: false,
    },
    body: { scale: 1, lineScale: 1.03 },
    subject: { color: 'accent', uppercase: false },
    signature: { bold: true },
  },
  {
    id: 'executive',
    name: 'Executive Letter',
    description: 'Serif text, a centered identity block, and a fine rule.',
    fontFamily: 'times',
    header: {
      ...IDENTITY_HEADER,
      align: 'center',
      nameScale: 1.14,
      nameLetterSpacingPt: 1.1,
      ruleWidthPt: 0.6,
      ruleGapPt: 12,
    },
    body: { scale: 1, lineScale: 1.06 },
    subject: { color: 'text', uppercase: false },
    signature: { bold: true },
  },
  {
    id: 'minimal',
    name: 'Minimal Letter',
    description: 'Compact sans-serif identity with no accent rule.',
    fontFamily: 'helvetica',
    header: {
      ...IDENTITY_HEADER,
      nameScale: 0.98,
      nameColor: 'text',
      showRule: false,
    },
    body: { scale: 1, lineScale: 1 },
    subject: { color: 'text', uppercase: false },
    signature: { bold: false },
  },
];

const RESUME_DESIGN_BY_ID = new Map(RESUME_DESIGNS.map((design) => [design.id, design]));
const COVER_LETTER_STYLE_BY_ID = new Map(COVER_LETTER_STYLES.map((style) => [style.id, style]));

export function resolveResumeDesign(id: ResumeLayoutId): ResumeDesign {
  return RESUME_DESIGN_BY_ID.get(id) ?? RESUME_DESIGNS[0];
}

export function resolveCoverLetterStyle(id: CoverLetterStyleId): CoverLetterStyle {
  return COVER_LETTER_STYLE_BY_ID.get(id) ?? COVER_LETTER_STYLES[0];
}

export function resumeDesignName(id: ResumeLayoutId): string {
  return resolveResumeDesign(id).name;
}

export function suggestedLetterStyle(id: ResumeLayoutId): CoverLetterStyleId {
  return resolveResumeDesign(id).suggestedLetterStyle;
}
