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

/** How the page is divided between full-width and columnar flows. */
export type ResumeArrangement = 'linear' | 'balanced' | 'sidebarRight' | 'sidebarLeft';

/** How the identity block is composed at the top of page one. */
export type HeaderVariant = 'stacked' | 'centered' | 'split' | 'banner' | 'compact';

/** How a section heading is decorated. */
export type HeadingDecor = 'none' | 'underline' | 'trailing' | 'bar' | 'fill' | 'topRule' | 'boxed';

/** How an entry's title, dates, and location are arranged. */
export type ItemLayout = 'stacked' | 'titleRow' | 'gutter';

export interface HeaderDesign {
  variant: HeaderVariant;
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
  /** Draws a second, finer rule under the first. */
  doubleRule: boolean;
  /** Inner padding used by the filled banner header. */
  bandPaddingPt: number;
}

export interface HeadingDesign {
  transform: 'upper' | 'title';
  scale: number;
  letterSpacingPt: number;
  color: 'accent' | 'text';
  decor: HeadingDecor;
  decorThicknessPt: number;
  decorColor: 'accent' | 'text' | 'muted';
  align: 'left' | 'center';
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

export interface ItemDesign {
  layout: ItemLayout;
  /** Width of the left date margin for the gutter layout. */
  gutterWidthPt: number;
  metaSeparator: string;
}

export interface SidebarDesign {
  tint: 'none' | 'muted' | 'accentSoft';
  divider: boolean;
  /** Share of the content width given to the sidebar. */
  widthRatio: number;
}

export interface ResumeDesignTraits {
  columns: 1 | 2;
  arrangement: ResumeArrangement;
  fontFamily: FontFamily;
  header: HeaderDesign;
  heading: HeadingDesign;
  item: ItemDesign;
  body: BodyDesign;
  sidebar: SidebarDesign;
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
  variant: 'stacked',
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
  doubleRule: false,
  bandPaddingPt: 12,
};

const IDENTITY_HEADING: HeadingDesign = {
  transform: 'upper',
  scale: 1,
  letterSpacingPt: 0,
  color: 'accent',
  decor: 'none',
  decorThicknessPt: 0,
  decorColor: 'accent',
  align: 'left',
  beforeScale: 1,
  afterScale: 1,
};

const IDENTITY_ITEM: ItemDesign = {
  layout: 'stacked',
  gutterWidthPt: 0,
  metaSeparator: '  ·  ',
};

const NO_SIDEBAR: SidebarDesign = {
  tint: 'none',
  divider: false,
  // The original balanced layout keeps its 63.08% main column exactly.
  widthRatio: 0.3692,
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

function design(traits: {
  id: ResumeLayoutId;
  name: string;
  description: string;
  suggestedLetterStyle: CoverLetterStyleId;
  columns: 1 | 2;
  arrangement: ResumeArrangement;
  fontFamily: FontFamily;
  header: Partial<HeaderDesign>;
  heading: Partial<HeadingDesign>;
  item?: Partial<ItemDesign>;
  body?: Partial<BodyDesign>;
  sidebar?: Partial<SidebarDesign>;
}): ResumeDesign {
  return {
    id: traits.id,
    name: traits.name,
    description: traits.description,
    suggestedLetterStyle: traits.suggestedLetterStyle,
    columns: traits.columns,
    arrangement: traits.arrangement,
    fontFamily: traits.fontFamily,
    header: { ...IDENTITY_HEADER, ...traits.header },
    heading: { ...IDENTITY_HEADING, ...traits.heading },
    item: { ...IDENTITY_ITEM, ...traits.item },
    body: { ...IDENTITY_BODY, ...traits.body },
    sidebar: { ...NO_SIDEBAR, ...traits.sidebar },
  };
}

export const RESUME_DESIGNS: ResumeDesign[] = [
  design({
    id: 'twoColumn',
    name: 'Professional Two-Column',
    description: 'The original balanced main-and-side layout.',
    suggestedLetterStyle: 'classic',
    columns: 2,
    arrangement: 'balanced',
    fontFamily: 'helvetica',
    header: {},
    heading: {},
  }),
  design({
    id: 'atsSimple',
    name: 'ATS Simple',
    description: 'One linear column with plain, conventional section headings.',
    suggestedLetterStyle: 'minimal',
    columns: 1,
    arrangement: 'linear',
    fontFamily: 'helvetica',
    header: {},
    heading: {},
  }),
  design({
    id: 'executive',
    name: 'Executive',
    description: 'A centered serif masthead with fine rules and dates aligned to the right.',
    suggestedLetterStyle: 'executive',
    columns: 1,
    arrangement: 'linear',
    fontFamily: 'times',
    header: {
      variant: 'centered',
      align: 'center',
      nameScale: 1.16,
      nameLetterSpacingPt: 1.2,
      headlineScale: 1.02,
      ruleWidthPt: 0.6,
      ruleColor: 'text',
      ruleGapPt: 12,
      doubleRule: true,
    },
    heading: {
      scale: 0.96,
      letterSpacingPt: 1.8,
      color: 'text',
      decor: 'underline',
      decorThicknessPt: 0.5,
      decorColor: 'text',
      beforeScale: 1.15,
      afterScale: 1.2,
    },
    item: { layout: 'titleRow' },
    body: {
      lineScale: 1.06,
      metaScale: 0.98,
      itemBeforeScale: 1.05,
      paragraphAfterScale: 1.05,
      bulletAfterScale: 1.1,
    },
  }),
  design({
    id: 'modernMinimal',
    name: 'Modern Minimal',
    description: 'A split identity, quiet trailing rules, and generous whitespace.',
    suggestedLetterStyle: 'modern',
    columns: 1,
    arrangement: 'linear',
    fontFamily: 'helvetica',
    header: {
      variant: 'split',
      nameScale: 1.1,
      nameLetterSpacingPt: 0.4,
      nameColor: 'text',
      showRule: false,
    },
    heading: {
      scale: 0.9,
      letterSpacingPt: 1.4,
      color: 'text',
      decor: 'trailing',
      decorThicknessPt: 0.5,
      decorColor: 'muted',
      beforeScale: 1.5,
      afterScale: 1.2,
    },
    item: { layout: 'titleRow' },
    body: {
      lineScale: 1.04,
      itemBeforeScale: 1.12,
      paragraphAfterScale: 1.1,
    },
  }),
  design({
    id: 'classic',
    name: 'Classic',
    description: 'A centered serif identity with framed section headings.',
    suggestedLetterStyle: 'classic',
    columns: 1,
    arrangement: 'linear',
    fontFamily: 'times',
    header: {
      variant: 'centered',
      align: 'center',
      nameScale: 1.04,
      nameLetterSpacingPt: 0.5,
      nameColor: 'text',
      ruleWidthPt: 0.6,
      ruleColor: 'text',
      ruleGapPt: 10,
      doubleRule: true,
    },
    heading: {
      scale: 0.92,
      letterSpacingPt: 1.2,
      color: 'text',
      decor: 'boxed',
      decorThicknessPt: 0.5,
      decorColor: 'text',
      align: 'center',
      beforeScale: 1.2,
      afterScale: 1,
    },
    item: { layout: 'titleRow' },
    body: { lineScale: 1.04 },
  }),
  design({
    id: 'creative',
    name: 'Creative',
    description: 'A tinted left rail, an oversized name, and bold section bars.',
    suggestedLetterStyle: 'modern',
    columns: 2,
    arrangement: 'sidebarLeft',
    fontFamily: 'helvetica',
    header: {
      nameScale: 1.38,
      showRule: true,
      ruleWidthPt: 3,
      ruleGapPt: 8,
    },
    heading: {
      scale: 1.04,
      letterSpacingPt: 1.2,
      decor: 'bar',
      decorThicknessPt: 3,
      decorColor: 'accent',
      beforeScale: 1.15,
      afterScale: 1,
    },
    body: {
      bulletChar: '–',
      itemBeforeScale: 1.1,
    },
    sidebar: { tint: 'accentSoft', widthRatio: 0.38 },
  }),
  design({
    id: 'compact',
    name: 'Compact',
    description: 'A dense two-column layout with a narrow tinted rail and inline dates.',
    suggestedLetterStyle: 'minimal',
    columns: 2,
    arrangement: 'balanced',
    fontFamily: 'helvetica',
    header: {
      variant: 'compact',
      nameScale: 0.98,
      ruleWidthPt: 0.8,
      ruleGapPt: 6,
    },
    heading: {
      scale: 0.9,
      letterSpacingPt: 0.4,
      decor: 'bar',
      decorThicknessPt: 2,
      decorColor: 'accent',
      beforeScale: 0.7,
      afterScale: 0.75,
    },
    item: { layout: 'titleRow' },
    body: {
      scale: 0.92,
      lineScale: 0.94,
      metaScale: 0.94,
      itemBeforeScale: 0.75,
      paragraphAfterScale: 0.8,
      bulletAfterScale: 0.8,
    },
    sidebar: { tint: 'muted', divider: true, widthRatio: 0.34 },
  }),
  design({
    id: 'academic',
    name: 'Academic',
    description: 'A serif CV with a dated left margin and understated headings.',
    suggestedLetterStyle: 'classic',
    columns: 1,
    arrangement: 'linear',
    fontFamily: 'times',
    header: {
      variant: 'split',
      nameScale: 1.06,
      nameLetterSpacingPt: 0.3,
      nameColor: 'text',
      ruleWidthPt: 0.5,
      ruleColor: 'text',
      ruleGapPt: 10,
    },
    heading: {
      scale: 0.94,
      letterSpacingPt: 0.8,
      color: 'text',
      decor: 'underline',
      decorThicknessPt: 0.5,
      decorColor: 'text',
      beforeScale: 1.1,
      afterScale: 0.9,
    },
    item: { layout: 'gutter', gutterWidthPt: 76 },
    body: { lineScale: 1.03 },
  }),
  design({
    id: 'contemporary',
    name: 'Contemporary',
    description: 'An accent banner header above a tinted right rail and top-rule headings.',
    suggestedLetterStyle: 'modern',
    columns: 2,
    arrangement: 'sidebarRight',
    fontFamily: 'helvetica',
    header: {
      variant: 'banner',
      nameScale: 1.22,
      nameLetterSpacingPt: 0.8,
      showRule: false,
      bandPaddingPt: 14,
    },
    heading: {
      scale: 0.92,
      letterSpacingPt: 1.3,
      decor: 'topRule',
      decorThicknessPt: 1.2,
      decorColor: 'accent',
      beforeScale: 1.1,
      afterScale: 1,
    },
    item: { layout: 'titleRow' },
    body: { lineScale: 1.02 },
    sidebar: { tint: 'accentSoft', divider: true, widthRatio: 0.32 },
  }),
  design({
    id: 'bold',
    name: 'Bold',
    description: 'A solid banner identity and filled section bands with reversed text.',
    suggestedLetterStyle: 'modern',
    columns: 1,
    arrangement: 'linear',
    fontFamily: 'helvetica',
    header: {
      variant: 'banner',
      nameScale: 1.5,
      nameLetterSpacingPt: 0.2,
      showRule: false,
      bandPaddingPt: 16,
    },
    heading: {
      scale: 1,
      letterSpacingPt: 1.4,
      decor: 'fill',
      decorThicknessPt: 0,
      decorColor: 'accent',
      beforeScale: 1.2,
      afterScale: 1,
    },
    item: { layout: 'titleRow' },
    body: {
      scale: 1.02,
      lineScale: 1.02,
      itemBeforeScale: 1.15,
    },
  }),
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
      variant: 'centered',
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

const RESUME_DESIGN_BY_ID = new Map(RESUME_DESIGNS.map((entry) => [entry.id, entry]));
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
