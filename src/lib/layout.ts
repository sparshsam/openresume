import {
  resolveResumeDesign,
  type HeaderDesign,
  type HeaderVariant,
  type ItemLayout,
  type ResumeArrangement,
  type ResumeDesign,
} from './designs';
import { measureLineWidth, wrapText, type FontFamily, type FontSpec } from './measure';
import { resolveMetrics, type ResolvedMetrics } from './metrics';
import { normalizeTemplate } from './normalize';
import {
  blockHeight,
  paginateColumn,
  type BlockKind,
  type FlowBlock,
  type FlowRect,
  type PlacedBlock,
  type PlacedRect,
} from './paginate';
import { LIST_KINDS } from './parse';
import { COLORS } from './tokens';
import type { DocumentKind } from '../types/document';
import type {
  ColumnId,
  Contact,
  Resume,
  ResumeItem,
  ResumeLayoutId,
  ResumeSection,
} from '../types/resume';

export type LayoutVariant = ResumeLayoutId | 'letter';

export interface HeaderLine {
  text: string;
  xPt: number;
  yPt: number;
  font: FontSpec;
  color: string;
}

export interface HeaderRule {
  x1Pt: number;
  y1Pt: number;
  x2Pt: number;
  y2Pt: number;
  widthPt: number;
  color: string;
}

export interface HeaderLayout {
  name: HeaderLine;
  headline?: HeaderLine;
  contactLines: HeaderLine[];
  rule?: HeaderRule;
  secondRule?: HeaderRule;
  band?: PlacedRect;
}

export interface PageLayout {
  index: number;
  widthPt: number;
  heightPt: number;
  blocks: PlacedBlock[];
  header?: HeaderLayout;
  /** Filled rectangles drawn behind the page content (sidebar tint). */
  backgrounds?: PlacedRect[];
  /** A vertical rule separating a sidebar from the main column. */
  divider?: PlacedRect;
}

export interface Layout {
  kind: DocumentKind;
  /** Which template produced this layout. */
  variant: LayoutVariant;
  /** Column count; exporters choose table or linear output from this. */
  columns: 1 | 2;
  /** How the document is composed: linear, balanced, or a sidebar. */
  arrangement: ResumeArrangement;
  headerVariant: HeaderVariant;
  itemLayout: ItemLayout;
  /** Resolved sidebar tint, if the design uses one. */
  sidebarTint?: string;
  sidebarSide?: 'left' | 'right';
  sidebarDivider?: boolean;
  headerAlign: 'left' | 'center';
  fontFamily: FontFamily;
  pages: PageLayout[];
  pageWidthPt: number;
  pageHeightPt: number;
  pageSizeLabel: string;
  metrics: ResolvedMetrics;
  accent: string;
}

export interface DocumentIdentity {
  name: string;
  headline?: string;
  contact: Contact;
}

const BAND_TEXT = '#FFFFFF';
const SIDEBAR_MUTED = '#F3F5F2';
const DIVIDER_COLOR = '#D5DED7';

function bodyFont(metrics: ResolvedMetrics, family: FontFamily): FontSpec {
  return { sizePt: metrics.bodyPt, family };
}

function boldFont(metrics: ResolvedMetrics, family: FontFamily): FontSpec {
  return { sizePt: metrics.bodyPt, bold: true, family };
}

function smallFont(metrics: ResolvedMetrics, family: FontFamily): FontSpec {
  return { sizePt: metrics.smallPt, family };
}

function headingFont(metrics: ResolvedMetrics, family: FontFamily, letterSpacingPt = 0): FontSpec {
  return { sizePt: metrics.headingPt, bold: true, family, letterSpacingPt };
}

const DEFAULT_HEADER_DESIGN: HeaderDesign = {
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

function pickDesignColor(mode: 'accent' | 'text' | 'muted', accent: string): string {
  if (mode === 'accent') return accent;
  if (mode === 'muted') return COLORS.muted;
  return COLORS.text;
}

/** Mix an accent with white so a tint stays light at every accent value. */
export function tintAccent(accent: string, strength: number): string {
  const value = accent.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) return SIDEBAR_MUTED;
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16);
    return Math.round(255 * (1 - strength) + channel * strength)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`.toUpperCase();
}

function resolveSidebarTint(
  tint: ResumeDesign['sidebar']['tint'],
  accent: string,
): string | undefined {
  if (tint === 'muted') return SIDEBAR_MUTED;
  if (tint === 'accentSoft') return tintAccent(accent, 0.08);
  return undefined;
}

function contactParts(contact: Contact): string[] {
  return [
    contact.email,
    contact.phone,
    contact.location,
    ...contact.links.map((link) => link.label),
  ].filter((part): part is string => Boolean(part));
}

export function buildDocumentHeader(
  identity: DocumentIdentity,
  metrics: ResolvedMetrics,
  accent: string = COLORS.accent,
  design: HeaderDesign = DEFAULT_HEADER_DESIGN,
  family: FontFamily = 'helvetica',
): { header: HeaderLayout; heightPt: number } {
  const nameFont: FontSpec = {
    sizePt: metrics.namePt,
    bold: true,
    family,
    letterSpacingPt: design.nameLetterSpacingPt,
  };
  const headlineFont: FontSpec = { sizePt: metrics.headlinePt, family };
  const contactFont = smallFont(metrics, family);
  const contactText = contactParts(identity.contact).join(design.contactJoin);
  const contentWidthPt = metrics.contentWidthPt;
  const rightEdgePt = metrics.pageWidthPt - metrics.marginXPt;

  const ruleAt = (yPt: number, widthPt: number, color: string): HeaderRule => ({
    x1Pt: metrics.marginXPt,
    y1Pt: yPt,
    x2Pt: metrics.pageWidthPt - metrics.marginXPt,
    y2Pt: yPt,
    widthPt,
    color,
  });

  if (design.variant === 'banner') {
    const padding = design.bandPaddingPt;
    const name: HeaderLine = {
      text: identity.name,
      xPt: metrics.marginXPt + padding,
      yPt: metrics.marginTopPt + padding,
      font: nameFont,
      color: BAND_TEXT,
    };
    let bottomPt = name.yPt + metrics.nameLinePt;
    let headline: HeaderLine | undefined;
    if (identity.headline) {
      headline = {
        text: identity.headline,
        xPt: metrics.marginXPt + padding,
        yPt: bottomPt + 2,
        font: headlineFont,
        color: BAND_TEXT,
      };
      bottomPt = headline.yPt + metrics.headlineLinePt;
    }
    const band: PlacedRect = {
      xPt: metrics.marginXPt,
      yPt: metrics.marginTopPt,
      widthPt: contentWidthPt,
      heightPt: bottomPt - metrics.marginTopPt + padding,
      color: accent,
    };
    const contactTopPt = band.yPt + band.heightPt + 10;
    const contactRows = contactText ? wrapText(contactText, contentWidthPt, contactFont) : [];
    const contactLines = contactRows.map((text, index) => ({
      text,
      xPt: metrics.marginXPt,
      yPt: contactTopPt + index * metrics.smallLinePt,
      font: contactFont,
      color: COLORS.muted,
    }));
    const cursorPt = contactTopPt + contactRows.length * metrics.smallLinePt;
    const ruleY = cursorPt + design.ruleGapPt;
    const rule = design.showRule
      ? ruleAt(ruleY, design.ruleWidthPt, pickDesignColor(design.ruleColor, accent))
      : undefined;
    const columnTop = (design.showRule ? ruleY : cursorPt) + 10;
    return {
      header: { name, headline, contactLines, rule, band },
      heightPt: columnTop - metrics.marginTopPt,
    };
  }

  if (design.variant === 'split') {
    const rightWidthPt = contentWidthPt * 0.4;
    const name: HeaderLine = {
      text: identity.name,
      xPt: metrics.marginXPt,
      yPt: metrics.marginTopPt,
      font: nameFont,
      color: pickDesignColor(design.nameColor, accent),
    };
    let leftBottomPt = name.yPt + metrics.nameLinePt;
    let headline: HeaderLine | undefined;
    if (identity.headline) {
      headline = {
        text: identity.headline,
        xPt: metrics.marginXPt,
        yPt: leftBottomPt + 4,
        font: headlineFont,
        color: COLORS.text,
      };
      leftBottomPt = headline.yPt + metrics.headlineLinePt;
    }
    const contactRows = contactText ? wrapText(contactText, rightWidthPt, contactFont) : [];
    const contactLines = contactRows.map((text, index) => ({
      text,
      xPt: rightEdgePt - measureLineWidth(text, contactFont),
      yPt: metrics.marginTopPt + index * metrics.smallLinePt,
      font: contactFont,
      color: COLORS.muted,
    }));
    const contactBottomPt = metrics.marginTopPt + contactRows.length * metrics.smallLinePt;
    const cursorPt = Math.max(leftBottomPt, contactBottomPt);
    const ruleY = cursorPt + design.ruleGapPt;
    const rule = design.showRule
      ? ruleAt(ruleY, design.ruleWidthPt, pickDesignColor(design.ruleColor, accent))
      : undefined;
    const secondRule =
      design.doubleRule && design.showRule
        ? ruleAt(
            ruleY + 3,
            Math.max(0.4, design.ruleWidthPt * 0.6),
            pickDesignColor(design.ruleColor, accent),
          )
        : undefined;
    const columnTop = (design.showRule ? ruleY + (secondRule ? 3 : 0) : cursorPt) + 10;
    return {
      header: { name, headline, contactLines, rule, secondRule },
      heightPt: columnTop - metrics.marginTopPt,
    };
  }

  if (design.variant === 'compact') {
    const contactWidthPt = contentWidthPt * 0.42;
    const contactRows = contactText ? wrapText(contactText, contactWidthPt, contactFont) : [];
    const contactLines = contactRows.map((text, index) => ({
      text,
      xPt: rightEdgePt - measureLineWidth(text, contactFont),
      yPt: metrics.marginTopPt + index * metrics.smallLinePt,
      font: contactFont,
      color: COLORS.muted,
    }));
    const contactBottomPt = metrics.marginTopPt + contactRows.length * metrics.smallLinePt;
    const nameWidthPt = measureLineWidth(identity.name, nameFont);
    const headlineInline =
      Boolean(identity.headline) &&
      nameWidthPt + 12 + measureLineWidth(identity.headline ?? '', headlineFont) <=
        contentWidthPt * 0.55;
    const name: HeaderLine = {
      text: identity.name,
      xPt: metrics.marginXPt,
      yPt: metrics.marginTopPt,
      font: nameFont,
      color: pickDesignColor(design.nameColor, accent),
    };
    let leftBottomPt = name.yPt + metrics.nameLinePt;
    let headline: HeaderLine | undefined;
    if (identity.headline) {
      headline = headlineInline
        ? {
            text: identity.headline,
            xPt: metrics.marginXPt + nameWidthPt + 12,
            yPt: name.yPt + (metrics.nameLinePt - metrics.headlineLinePt) / 2,
            font: headlineFont,
            color: COLORS.text,
          }
        : {
            text: identity.headline,
            xPt: metrics.marginXPt,
            yPt: leftBottomPt + 2,
            font: headlineFont,
            color: COLORS.text,
          };
      if (!headlineInline) leftBottomPt = headline.yPt + metrics.headlineLinePt;
    }
    const cursorPt = Math.max(leftBottomPt, contactBottomPt);
    const ruleY = cursorPt + design.ruleGapPt;
    const rule = design.showRule
      ? ruleAt(ruleY, design.ruleWidthPt, pickDesignColor(design.ruleColor, accent))
      : undefined;
    const columnTop = (design.showRule ? ruleY : cursorPt) + 10;
    return {
      header: { name, headline, contactLines, rule },
      heightPt: columnTop - metrics.marginTopPt,
    };
  }

  // Stacked and centered variants share the original identity composition.
  const centered = design.variant === 'centered' || design.align === 'center';
  const alignX = (text: string, font: FontSpec): number =>
    centered
      ? Math.max(metrics.marginXPt, (metrics.pageWidthPt - measureLineWidth(text, font)) / 2)
      : metrics.marginXPt;

  const name: HeaderLine = {
    text: identity.name,
    xPt: alignX(identity.name, nameFont),
    yPt: metrics.marginTopPt,
    font: nameFont,
    color: pickDesignColor(design.nameColor, accent),
  };

  let cursor = metrics.marginTopPt + metrics.nameLinePt;
  let headline: HeaderLine | undefined;

  if (identity.headline) {
    const yPt = cursor + 4;
    headline = {
      text: identity.headline,
      xPt: alignX(identity.headline, headlineFont),
      yPt,
      font: headlineFont,
      color: COLORS.text,
    };
    cursor = yPt + metrics.headlineLinePt;
  }

  const contactRows = contactText ? wrapText(contactText, contentWidthPt, contactFont) : [];

  const contactTop = cursor + (contactRows.length > 0 ? 8 : 0);
  const contactLines = contactRows.map((text, index) => ({
    text,
    xPt: alignX(text, contactFont),
    yPt: contactTop + index * metrics.smallLinePt,
    font: contactFont,
    color: COLORS.muted,
  }));

  cursor = contactTop + contactRows.length * metrics.smallLinePt;
  const ruleY = cursor + design.ruleGapPt;
  const ruleColor = pickDesignColor(design.ruleColor, accent);
  const rule = design.showRule ? ruleAt(ruleY, design.ruleWidthPt, ruleColor) : undefined;
  const secondRule =
    design.doubleRule && design.showRule
      ? ruleAt(ruleY + 3, Math.max(0.4, design.ruleWidthPt * 0.6), ruleColor)
      : undefined;
  const columnTop = (design.showRule ? ruleY + (secondRule ? 3 : 0) : cursor) + 10;

  return {
    header: { name, headline, contactLines, rule, secondRule },
    heightPt: columnTop - metrics.marginTopPt,
  };
}

export interface TextBlockOptions {
  kind: BlockKind;
  sectionId: string;
  itemId?: string;
  font: FontSpec;
  color: string;
  lineHeightPt: number;
  spaceBeforePt: number;
  spaceAfterPt: number;
  splittable?: boolean;
  keepWithNext?: boolean;
}

export function textBlock(text: string, widthPt: number, options: TextBlockOptions): FlowBlock {
  const lines = wrapText(text, widthPt, options.font).map((line) => ({
    text: line,
    xOffsetPt: 0,
    font: options.font,
    color: options.color,
  }));

  return {
    sectionId: options.sectionId,
    itemId: options.itemId,
    kind: options.kind,
    lineHeightPt: options.lineHeightPt,
    lines,
    spaceBeforePt: options.spaceBeforePt,
    spaceAfterPt: options.spaceAfterPt,
    splittable: options.splittable ?? true,
    keepWithNext: options.keepWithNext,
  };
}

function indentBlock(block: FlowBlock, indentPt: number): FlowBlock {
  return {
    ...block,
    indentLeftPt: indentPt,
    lines: block.lines.map((line) => ({ ...line, xOffsetPt: line.xOffsetPt + indentPt })),
  };
}

function bulletBlock(
  text: string,
  widthPt: number,
  metrics: ResolvedMetrics,
  sectionId: string,
  design: ResumeDesign,
  itemId?: string,
): FlowBlock {
  const font = bodyFont(metrics, design.fontFamily);
  const prefix = `${design.body.bulletChar}  `;
  const indentPt = measureLineWidth(prefix, font) + 1;
  const bodyLines = wrapText(text, widthPt - indentPt, font);
  const lines = bodyLines.map((line, index) => ({
    text: index === 0 ? `${prefix}${line}` : line,
    xOffsetPt: index === 0 ? 0 : indentPt,
    font,
    color: COLORS.text,
  }));

  return {
    sectionId,
    itemId,
    kind: 'bullet',
    lineHeightPt: metrics.bodyLinePt,
    lines,
    spaceBeforePt: 0,
    spaceAfterPt: metrics.bulletAfterPt,
    splittable: true,
  };
}

function headingBlock(
  section: ResumeSection,
  first: boolean,
  metrics: ResolvedMetrics,
  accent: string,
  design: ResumeDesign,
  widthPt: number,
): FlowBlock {
  const heading = design.heading;
  const text = heading.transform === 'upper' ? section.title.toUpperCase() : section.title;
  const font = headingFont(metrics, design.fontFamily, heading.letterSpacingPt);
  const textWidthPt = measureLineWidth(text, font);
  const centered = heading.align === 'center';
  let xOffsetPt = centered ? Math.max(0, (widthPt - textWidthPt) / 2) : 0;
  let yOffsetPt = 0;
  const rules: FlowRect[] = [];
  let band: FlowRect | undefined;
  let heightOverridePt: number | undefined;
  let spaceAfterPt = metrics.sectionAfterPt;
  const decorColor = pickDesignColor(heading.decorColor, accent);
  const thicknessPt = heading.decorThicknessPt;
  const gapPt = 2;

  const rule = (x: number, y: number, width: number, thickness: number): FlowRect => ({
    xOffsetPt: x,
    yOffsetPt: y,
    widthPt: width,
    heightPt: thickness,
    color: decorColor,
  });

  switch (heading.decor) {
    case 'underline':
      rules.push(rule(0, metrics.headingLinePt + gapPt, widthPt, thicknessPt));
      spaceAfterPt = Math.max(spaceAfterPt, thicknessPt + gapPt + 1);
      break;
    case 'trailing': {
      const startPt = xOffsetPt + textWidthPt + 6;
      if (startPt < widthPt) {
        rules.push(rule(startPt, metrics.headingLinePt + gapPt, widthPt - startPt, thicknessPt));
      }
      spaceAfterPt = Math.max(spaceAfterPt, thicknessPt + gapPt + 1);
      break;
    }
    case 'bar':
      xOffsetPt += thicknessPt + 8;
      rules.push(rule(0, 0, thicknessPt, metrics.headingLinePt));
      break;
    case 'fill':
      heightOverridePt = metrics.headingLinePt + 8;
      yOffsetPt = 4;
      xOffsetPt += 8;
      band = {
        xOffsetPt: 0,
        yOffsetPt: 0,
        widthPt,
        heightPt: heightOverridePt,
        color: decorColor,
      };
      break;
    case 'topRule':
      heightOverridePt = metrics.headingLinePt + 5;
      yOffsetPt = 5;
      rules.push(rule(0, 0, widthPt, thicknessPt));
      break;
    case 'boxed':
      heightOverridePt = metrics.headingLinePt + 10;
      yOffsetPt = 4;
      rules.push(rule(0, 0, widthPt, thicknessPt));
      rules.push(rule(0, metrics.headingLinePt + 7, widthPt, thicknessPt));
      spaceAfterPt = Math.max(spaceAfterPt, thicknessPt + 3);
      break;
    case 'none':
    default:
      break;
  }

  const color = heading.decor === 'fill' ? BAND_TEXT : pickDesignColor(heading.color, accent);

  return {
    sectionId: section.id,
    kind: 'heading',
    lineHeightPt: metrics.headingLinePt,
    spaceBeforePt: first ? 0 : metrics.sectionBeforePt,
    spaceAfterPt,
    splittable: false,
    keepWithNext: true,
    heightOverridePt,
    rules: rules.length > 0 ? rules : undefined,
    band,
    decorKind: heading.decor,
    alignment: centered ? 'center' : 'left',
    lines: [
      {
        text,
        xOffsetPt,
        yOffsetPt,
        font,
        color,
      },
    ],
  };
}

function entryMeta(item: ResumeItem, design: ResumeDesign): string {
  return [item.dateRange, item.location].filter(Boolean).join(design.item.metaSeparator);
}

interface TitleRowOptions {
  title: string;
  meta: string;
  widthPt: number;
  metrics: ResolvedMetrics;
  design: ResumeDesign;
  sectionId: string;
  itemId: string;
  spaceBeforePt: number;
  layout: 'metaRight' | 'metaLeft';
  gutterWidthPt?: number;
}

function titleRowBlock(options: TitleRowOptions): FlowBlock | null {
  const { title, meta, widthPt, metrics, design, sectionId, itemId, spaceBeforePt, layout } =
    options;
  const titleFont = boldFont(metrics, design.fontFamily);
  const metaFont = smallFont(metrics, design.fontFamily);

  if (layout === 'metaRight') {
    const metaWidthPt = measureLineWidth(meta, metaFont);
    if (metaWidthPt > widthPt * 0.52) return null;
    const titleWidthPt = widthPt - metaWidthPt - 10;
    const titleLines = wrapText(title, titleWidthPt, titleFont);
    const heightPt = Math.max(1, titleLines.length) * metrics.bodyLinePt;
    return {
      sectionId,
      itemId,
      kind: 'titleRow',
      lineHeightPt: metrics.bodyLinePt,
      heightOverridePt: heightPt,
      spaceBeforePt,
      spaceAfterPt: 0,
      splittable: false,
      keepWithNext: true,
      rowLayout: 'metaRight',
      lines: [
        ...titleLines.map((text, index) => ({
          text,
          xOffsetPt: 0,
          yOffsetPt: index * metrics.bodyLinePt,
          font: titleFont,
          color: COLORS.text,
        })),
        {
          text: meta,
          xOffsetPt: widthPt - metaWidthPt,
          yOffsetPt: 0,
          font: metaFont,
          color: COLORS.muted,
        },
      ],
    };
  }

  const gutterWidthPt = options.gutterWidthPt ?? design.item.gutterWidthPt;
  const metaLines = wrapText(meta, Math.max(24, gutterWidthPt - 6), metaFont);
  const titleWidthPt = Math.max(24, widthPt - gutterWidthPt - 4);
  const titleLines = wrapText(title, titleWidthPt, titleFont);
  const heightPt = Math.max(
    metaLines.length * metrics.smallLinePt,
    titleLines.length * metrics.bodyLinePt,
  );
  return {
    sectionId,
    itemId,
    kind: 'titleRow',
    lineHeightPt: metrics.bodyLinePt,
    heightOverridePt: heightPt,
    spaceBeforePt,
    spaceAfterPt: 0,
    splittable: false,
    keepWithNext: true,
    rowLayout: 'metaLeft',
    indentLeftPt: gutterWidthPt,
    lines: [
      ...metaLines.map((text, index) => ({
        text,
        xOffsetPt: 0,
        yOffsetPt: index * metrics.smallLinePt,
        font: metaFont,
        color: COLORS.muted,
      })),
      ...titleLines.map((text, index) => ({
        text,
        xOffsetPt: gutterWidthPt,
        yOffsetPt: index * metrics.bodyLinePt,
        font: titleFont,
        color: COLORS.text,
      })),
    ],
  };
}

function itemBlocks(
  section: ResumeSection,
  item: ResumeItem,
  widthPt: number,
  metrics: ResolvedMetrics,
  design: ResumeDesign,
  first: boolean,
): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  const before = first ? 0 : metrics.itemBeforePt;
  const body = bodyFont(metrics, design.fontFamily);
  const bold = boldFont(metrics, design.fontFamily);
  const small = smallFont(metrics, design.fontFamily);

  if (section.kind === 'skills') {
    if (item.title) {
      blocks.push(
        textBlock(item.title, widthPt, {
          kind: 'skillLabel',
          sectionId: section.id,
          itemId: item.id,
          font: bold,
          color: COLORS.text,
          lineHeightPt: metrics.bodyLinePt,
          spaceBeforePt: before,
          spaceAfterPt: 0,
          keepWithNext: true,
          splittable: false,
        }),
      );
    }
    if (item.subtitle) {
      blocks.push(
        textBlock(item.subtitle, widthPt, {
          kind: 'skillValue',
          sectionId: section.id,
          itemId: item.id,
          font: body,
          color: COLORS.text,
          lineHeightPt: metrics.bodyLinePt,
          spaceBeforePt: item.title ? 0 : before,
          spaceAfterPt: metrics.paragraphAfterPt * 1.5,
        }),
      );
    }
    return blocks;
  }

  if (LIST_KINDS.has(section.kind)) {
    const text = item.body ?? item.title ?? '';
    if (text) {
      if (section.kind === 'languages' || section.kind === 'interests') {
        blocks.push(bulletBlock(text, widthPt, metrics, section.id, design, item.id));
      } else {
        blocks.push(
          textBlock(text, widthPt, {
            kind: 'listItem',
            sectionId: section.id,
            itemId: item.id,
            font: body,
            color: COLORS.text,
            lineHeightPt: metrics.bodyLinePt,
            spaceBeforePt: before,
            spaceAfterPt: metrics.paragraphAfterPt,
          }),
        );
      }
    }
    for (const bullet of item.bullets) {
      blocks.push(bulletBlock(bullet, widthPt, metrics, section.id, design, item.id));
    }
    return blocks;
  }

  const meta = entryMeta(item, design);
  const useGutter = design.item.layout === 'gutter';
  const contentWidthPt = useGutter ? widthPt - design.item.gutterWidthPt : widthPt;
  // The dated gutter holds only the date range. A verified location goes on
  // its own indented line so a long place name cannot wrap the date column.
  const rowMeta = useGutter ? (item.dateRange ?? '') : meta;
  const separateLocation = useGutter && Boolean(item.location);

  if (design.item.layout !== 'stacked' && item.title && rowMeta) {
    const row = titleRowBlock({
      title: item.title,
      meta: rowMeta,
      widthPt,
      metrics,
      design,
      sectionId: section.id,
      itemId: item.id,
      spaceBeforePt: before,
      layout: useGutter ? 'metaLeft' : 'metaRight',
    });
    if (row) {
      blocks.push(row);
    } else {
      blocks.push(
        textBlock(item.title, widthPt, {
          kind: 'title',
          sectionId: section.id,
          itemId: item.id,
          font: bold,
          color: COLORS.text,
          lineHeightPt: metrics.bodyLinePt,
          spaceBeforePt: before,
          spaceAfterPt: 0,
          keepWithNext: true,
          splittable: false,
        }),
      );
      blocks.push(
        textBlock(meta, widthPt, {
          kind: 'meta',
          sectionId: section.id,
          itemId: item.id,
          font: small,
          color: COLORS.muted,
          lineHeightPt: metrics.smallLinePt,
          spaceBeforePt: 1.5,
          spaceAfterPt: 2,
          keepWithNext: Boolean(item.subtitle || item.body || item.bullets.length > 0),
          splittable: false,
        }),
      );
    }

    if (item.subtitle) {
      const subtitleBlock = textBlock(item.subtitle, contentWidthPt, {
        kind: 'subtitle',
        sectionId: section.id,
        itemId: item.id,
        font: body,
        color: COLORS.text,
        lineHeightPt: metrics.bodyLinePt,
        spaceBeforePt: 0,
        spaceAfterPt: 0,
        keepWithNext: Boolean(item.body || item.bullets.length > 0),
      });
      blocks.push(
        useGutter ? indentBlock(subtitleBlock, design.item.gutterWidthPt) : subtitleBlock,
      );
    }

    if (separateLocation && item.location) {
      const locationBlock = textBlock(item.location, contentWidthPt, {
        kind: 'meta',
        sectionId: section.id,
        itemId: item.id,
        font: small,
        color: COLORS.muted,
        lineHeightPt: metrics.smallLinePt,
        spaceBeforePt: 0,
        spaceAfterPt: 2,
        keepWithNext: Boolean(item.body || item.bullets.length > 0),
        splittable: false,
      });
      blocks.push(indentBlock(locationBlock, design.item.gutterWidthPt));
    }
  } else {
    if (item.title) {
      const titleBlock = textBlock(item.title, contentWidthPt, {
        kind: 'title',
        sectionId: section.id,
        itemId: item.id,
        font: bold,
        color: COLORS.text,
        lineHeightPt: metrics.bodyLinePt,
        spaceBeforePt: before,
        spaceAfterPt: 0,
        keepWithNext: true,
        splittable: false,
      });
      blocks.push(useGutter ? indentBlock(titleBlock, design.item.gutterWidthPt) : titleBlock);
    }

    if (item.subtitle) {
      const subtitleBlock = textBlock(item.subtitle, contentWidthPt, {
        kind: 'subtitle',
        sectionId: section.id,
        itemId: item.id,
        font: body,
        color: COLORS.text,
        lineHeightPt: metrics.bodyLinePt,
        spaceBeforePt: item.title ? 0 : before,
        spaceAfterPt: 0,
        keepWithNext: Boolean(
          item.dateRange || item.location || item.body || item.bullets.length > 0,
        ),
      });
      blocks.push(
        useGutter ? indentBlock(subtitleBlock, design.item.gutterWidthPt) : subtitleBlock,
      );
    }

    if (separateLocation && item.title && item.location) {
      const locationBlock = textBlock(item.location, contentWidthPt, {
        kind: 'meta',
        sectionId: section.id,
        itemId: item.id,
        font: small,
        color: COLORS.muted,
        lineHeightPt: metrics.smallLinePt,
        spaceBeforePt: 0,
        spaceAfterPt: 2,
        keepWithNext: Boolean(item.body || item.bullets.length > 0),
        splittable: false,
      });
      blocks.push(indentBlock(locationBlock, design.item.gutterWidthPt));
    }

    if (meta && !(design.item.layout === 'gutter' && item.title)) {
      const metaBlock = textBlock(meta, useGutter ? design.item.gutterWidthPt : widthPt, {
        kind: 'meta',
        sectionId: section.id,
        itemId: item.id,
        font: small,
        color: COLORS.muted,
        lineHeightPt: metrics.smallLinePt,
        spaceBeforePt: item.title || item.subtitle ? 1.5 : before,
        spaceAfterPt: 2,
        keepWithNext: Boolean(item.body || item.bullets.length > 0),
        splittable: false,
      });
      blocks.push(metaBlock);
    }
  }

  if (item.body) {
    const bodyBlock = textBlock(item.body, contentWidthPt, {
      kind: 'body',
      sectionId: section.id,
      itemId: item.id,
      font: body,
      color: COLORS.text,
      lineHeightPt: metrics.bodyLinePt,
      spaceBeforePt: item.title || item.subtitle || meta ? 0 : before,
      spaceAfterPt: metrics.paragraphAfterPt,
    });
    blocks.push(useGutter ? indentBlock(bodyBlock, design.item.gutterWidthPt) : bodyBlock);
  }

  for (const text of item.bullets) {
    const bullet = bulletBlock(text, contentWidthPt, metrics, section.id, design, item.id);
    blocks.push(useGutter ? indentBlock(bullet, design.item.gutterWidthPt) : bullet);
  }

  return blocks;
}

function hasContent(section: ResumeSection): boolean {
  return section.items.some(
    (item) =>
      Boolean(item.title || item.subtitle || item.body || item.dateRange || item.location) ||
      item.bullets.length > 0,
  );
}

function sectionGroups(
  section: ResumeSection,
  widthPt: number,
  metrics: ResolvedMetrics,
  design: ResumeDesign,
): FlowBlock[][] {
  const groups: FlowBlock[][] = [];

  if (section.kind === 'summary' || section.kind === 'custom') {
    section.items.forEach((item, itemIndex) => {
      const group: FlowBlock[] = [];
      if (item.body) {
        group.push(
          textBlock(item.body, widthPt, {
            kind: 'body',
            sectionId: section.id,
            itemId: item.id,
            font: bodyFont(metrics, design.fontFamily),
            color: COLORS.text,
            lineHeightPt: metrics.bodyLinePt,
            spaceBeforePt: itemIndex === 0 ? 0 : metrics.itemBeforePt,
            spaceAfterPt: metrics.paragraphAfterPt,
          }),
        );
      }
      for (const bullet of item.bullets) {
        group.push(bulletBlock(bullet, widthPt, metrics, section.id, design, item.id));
      }
      if (group.length > 0) groups.push(group);
    });
    return groups;
  }

  section.items.forEach((item, itemIndex) => {
    const group = itemBlocks(section, item, widthPt, metrics, design, itemIndex === 0);
    if (group.length > 0) groups.push(group);
  });
  return groups;
}

function buildSectionBlocks(
  sections: ResumeSection[],
  widthPt: number,
  metrics: ResolvedMetrics,
  accent: string,
  design: ResumeDesign,
  keepEntriesTogether: boolean,
): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  let first = true;

  for (const section of sections) {
    if (!section.enabled || !hasContent(section)) continue;

    const heading = headingBlock(section, first, metrics, accent, design, widthPt);
    if (section.startOnNewPage) heading.forcePageBreak = true;

    const groups = sectionGroups(section, widthPt, metrics, design);
    let firstGroupHeightPt = 0;
    groups.forEach((group, groupIndex) => {
      const heightPt = group.reduce((sum, block) => sum + blockHeight(block), 0);
      if (groupIndex === 0) firstGroupHeightPt = heightPt;
      if (keepEntriesTogether && group[0]) {
        group[0].groupHeightPt = heightPt;
      }
    });

    // A heading always travels with its first entry when that unit fits a page.
    if (groups[0]) {
      heading.groupHeightPt = blockHeight(heading) + firstGroupHeightPt;
    }

    blocks.push(heading, ...groups.flat());
    first = false;
  }

  return blocks;
}

function buildColumnBlocks(
  resume: Resume,
  column: ColumnId,
  widthPt: number,
  metrics: ResolvedMetrics,
  accent: string,
  design: ResumeDesign,
  keepEntriesTogether: boolean,
): FlowBlock[] {
  return buildSectionBlocks(
    resume.sections.filter((section) => section.column === column),
    widthPt,
    metrics,
    accent,
    design,
    keepEntriesTogether,
  );
}

export function translatePlacedBlock(block: PlacedBlock, xPt: number, yPt: number): PlacedBlock {
  const translate = (rect: PlacedRect): PlacedRect => ({
    ...rect,
    xPt: rect.xPt + xPt,
    yPt: rect.yPt + yPt,
  });
  return {
    ...block,
    xPt: block.xPt + xPt,
    yPt: block.yPt + yPt,
    lines: block.lines.map((line) => ({
      ...line,
      xPt: line.xPt + xPt,
      yPt: line.yPt + yPt,
    })),
    rule: block.rule ? translate(block.rule) : undefined,
    rules: block.rules ? block.rules.map(translate) : undefined,
    band: block.band ? translate(block.band) : undefined,
  };
}

/**
 * Places one linear block flow down the full content width. Used by linear
 * resume designs; each block keeps the shared item formatting.
 */
export function assembleSingleColumnPages(
  blocks: FlowBlock[],
  header: HeaderLayout,
  headerHeightPt: number,
  metrics: ResolvedMetrics,
  keepEntriesTogether = true,
): PageLayout[] {
  const firstCapacityPt =
    metrics.pageHeightPt - metrics.marginTopPt - headerHeightPt - metrics.marginBottomPt;
  const restCapacityPt = metrics.pageHeightPt - metrics.marginTopPt - metrics.marginBottomPt;

  const columnPages = paginateColumn(
    blocks,
    firstCapacityPt,
    restCapacityPt,
    metrics.contentWidthPt,
    { keepEntriesTogether },
  );

  const pages: PageLayout[] = Array.from(
    { length: Math.max(1, columnPages.length) },
    (_, index) => {
      const top = metrics.marginTopPt + (index === 0 ? headerHeightPt : 0);
      return {
        index,
        widthPt: metrics.pageWidthPt,
        heightPt: metrics.pageHeightPt,
        blocks: (columnPages[index] ?? []).map((block) =>
          translatePlacedBlock(block, metrics.marginXPt, top),
        ),
        header: index === 0 ? header : undefined,
      };
    },
  );

  const contentPages = pages.filter((page) => page.blocks.length > 0 || page.header);
  const finalPages = contentPages.length > 0 ? contentPages : pages.slice(0, 1);
  finalPages.forEach((page, index) => {
    page.index = index;
  });
  return finalPages;
}

function resumeLayout(
  design: ResumeDesign,
  pages: PageLayout[],
  metrics: ResolvedMetrics,
  accent: string,
): Layout {
  return {
    kind: 'resume',
    variant: design.id,
    columns: design.columns,
    arrangement: design.arrangement,
    headerVariant: design.header.variant,
    itemLayout: design.item.layout,
    sidebarTint: resolveSidebarTint(design.sidebar.tint, accent),
    sidebarSide:
      design.columns === 2 ? (design.arrangement === 'sidebarLeft' ? 'left' : 'right') : undefined,
    sidebarDivider: design.sidebar.divider,
    headerAlign: design.header.align,
    fontFamily: design.fontFamily,
    pages,
    pageWidthPt: metrics.pageWidthPt,
    pageHeightPt: metrics.pageHeightPt,
    pageSizeLabel: metrics.pageSizeLabel,
    metrics,
    accent,
  };
}

export function layoutResume(resume: Resume): Layout {
  const template = normalizeTemplate(resume.template);
  const design = resolveResumeDesign(template.layout);
  const metrics = resolveMetrics(template);
  const accent = template.accent || COLORS.accent;
  const keepEntriesTogether = template.pagination.keepEntriesTogether;
  const { header, heightPt: headerHeightPt } = buildDocumentHeader(
    {
      name: resume.header.name,
      headline: resume.header.headline,
      contact: resume.contact,
    },
    metrics,
    accent,
    design.header,
    design.fontFamily,
  );

  if (design.arrangement === 'linear') {
    // One linear reading order across every section, regardless of the
    // two-column `column` assignment stored on each section.
    const blocks = buildSectionBlocks(
      resume.sections,
      metrics.contentWidthPt,
      metrics,
      accent,
      design,
      keepEntriesTogether,
    );
    return resumeLayout(
      design,
      assembleSingleColumnPages(blocks, header, headerHeightPt, metrics, keepEntriesTogether),
      metrics,
      accent,
    );
  }

  const firstCapacityPt =
    metrics.pageHeightPt - metrics.marginTopPt - headerHeightPt - metrics.marginBottomPt;
  const restCapacityPt = metrics.pageHeightPt - metrics.marginTopPt - metrics.marginBottomPt;

  const mainBlocks = buildColumnBlocks(
    resume,
    'main',
    metrics.mainWidthPt,
    metrics,
    accent,
    design,
    keepEntriesTogether,
  );
  const sideBlocks = buildColumnBlocks(
    resume,
    'side',
    metrics.sideWidthPt,
    metrics,
    accent,
    design,
    keepEntriesTogether,
  );

  const pageOptions = { keepEntriesTogether };
  const mainPages = paginateColumn(
    mainBlocks,
    firstCapacityPt,
    restCapacityPt,
    metrics.mainWidthPt,
    pageOptions,
  );
  const sidePages = paginateColumn(
    sideBlocks,
    firstCapacityPt,
    restCapacityPt,
    metrics.sideWidthPt,
    pageOptions,
  );

  const pageCount = Math.max(1, mainPages.length, sidePages.length);
  const sidebarOnLeft = design.arrangement === 'sidebarLeft';
  const mainX = sidebarOnLeft
    ? metrics.marginXPt + metrics.sideWidthPt + metrics.gapPt
    : metrics.marginXPt;
  const sideX = sidebarOnLeft
    ? metrics.marginXPt
    : metrics.marginXPt + metrics.mainWidthPt + metrics.gapPt;
  const sidebarTint = resolveSidebarTint(design.sidebar.tint, accent);
  const dividerX = sidebarOnLeft
    ? metrics.marginXPt + metrics.sideWidthPt + metrics.gapPt / 2
    : sideX - metrics.gapPt / 2;

  const pages: PageLayout[] = Array.from({ length: pageCount }, (_, index) => {
    const top = metrics.marginTopPt + (index === 0 ? headerHeightPt : 0);
    const blocks = [
      ...(mainPages[index] ?? []).map((block) => translatePlacedBlock(block, mainX, top)),
      ...(sidePages[index] ?? []).map((block) => translatePlacedBlock(block, sideX, top)),
    ];
    const contentBottomPt = metrics.pageHeightPt - metrics.marginBottomPt;
    const backgroundHeightPt = Math.max(0, contentBottomPt - top);
    return {
      index,
      widthPt: metrics.pageWidthPt,
      heightPt: metrics.pageHeightPt,
      blocks,
      header: index === 0 ? header : undefined,
      backgrounds: sidebarTint
        ? [
            {
              xPt: sideX,
              yPt: top,
              widthPt: metrics.sideWidthPt,
              heightPt: backgroundHeightPt,
              color: sidebarTint,
            },
          ]
        : undefined,
      divider: design.sidebar.divider
        ? {
            xPt: dividerX,
            yPt: top,
            widthPt: 0.6,
            heightPt: backgroundHeightPt,
            color: DIVIDER_COLOR,
          }
        : undefined,
    };
  });

  const contentPages = pages.filter((page) => page.blocks.length > 0 || page.header);
  const finalPages = contentPages.length > 0 ? contentPages : pages.slice(0, 1);
  finalPages.forEach((page, index) => {
    page.index = index;
  });

  return resumeLayout(design, finalPages, metrics, accent);
}
