import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  SectionType,
  ShadingType,
  Tab,
  TabStopType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { IParagraphOptions, ISectionOptions } from 'docx';
import type { DocumentIdentity, HeaderLayout, Layout, PageLayout } from './layout';
import type { FontSpec } from './measure';
import type { ResolvedMetrics } from './metrics';
import type { PlacedBlock } from './paginate';
import { COLORS } from './tokens';
import type { CoverLetter } from '../types/coverLetter';
import type { Resume } from '../types/resume';
import { DEFAULT_APPLICATION_KIT_ORDER, type ApplicationKitOrder } from '../types/applicationKit';

const PT_TO_TWIP = 20;
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const CELL_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};
const TABLE_BORDERS = {
  ...CELL_BORDERS,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

interface BlockStyle {
  bold: boolean;
  color: string;
  sizeHalfPt: number;
  beforeTwip: number;
  afterTwip: number;
  bullet: boolean;
  keepNext: boolean;
  keepLines: boolean;
}

function hexColor(value: string): string {
  return value.replace('#', '').toUpperCase();
}

function docxFont(font: FontSpec | undefined): string {
  return font?.family === 'times' ? 'Times New Roman' : 'Helvetica';
}

function styleFor(block: PlacedBlock, metrics: ResolvedMetrics): BlockStyle {
  const body = Math.round(metrics.bodyPt * 2);
  const small = Math.round(metrics.smallPt * 2);
  const heading = Math.round(metrics.headingPt * 2);
  const before = Math.round(metrics.itemBeforePt * PT_TO_TWIP);
  const after = Math.round(metrics.paragraphAfterPt * PT_TO_TWIP);

  switch (block.kind) {
    case 'heading':
      return {
        bold: true,
        color: block.lines[0]?.color ?? COLORS.accent,
        sizeHalfPt: heading,
        beforeTwip: Math.round(metrics.sectionBeforePt * PT_TO_TWIP),
        afterTwip: Math.round(metrics.sectionAfterPt * PT_TO_TWIP),
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'titleRow':
    case 'title':
      return {
        bold: true,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: before,
        afterTwip: 0,
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'subtitle':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: 0,
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'meta':
      return {
        bold: false,
        color: COLORS.muted,
        sizeHalfPt: small,
        beforeTwip: 0,
        afterTwip: Math.round(2 * PT_TO_TWIP),
        bullet: false,
        keepNext: true,
        keepLines: false,
      };
    case 'bullet':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: Math.round(metrics.bulletAfterPt * PT_TO_TWIP),
        bullet: true,
        keepNext: false,
        keepLines: true,
      };
    case 'listItem':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: after,
        bullet: false,
        keepNext: false,
        keepLines: true,
      };
    case 'skillLabel':
      return {
        bold: true,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: before,
        afterTwip: 0,
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'skillValue':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: Math.round(metrics.paragraphAfterPt * 1.5 * PT_TO_TWIP),
        bullet: false,
        keepNext: false,
        keepLines: true,
      };
    case 'letterDate':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: Math.round(12 * PT_TO_TWIP),
        bullet: false,
        keepNext: false,
        keepLines: false,
      };
    case 'recipient':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: 0,
        bullet: false,
        keepNext: false,
        keepLines: true,
      };
    case 'subject':
      return {
        bold: true,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: Math.round(10 * PT_TO_TWIP),
        afterTwip: Math.round(10 * PT_TO_TWIP),
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'salutation':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: Math.round(10 * PT_TO_TWIP),
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'letterBody':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: Math.round(metrics.paragraphSpacingPt * PT_TO_TWIP),
        bullet: false,
        keepNext: false,
        keepLines: true,
      };
    case 'closing':
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: Math.round(14 * PT_TO_TWIP),
        afterTwip: 0,
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
    case 'signature':
      return {
        bold: true,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: Math.round(22 * PT_TO_TWIP),
        afterTwip: 0,
        bullet: false,
        keepNext: false,
        keepLines: true,
      };
    case 'body':
    default:
      return {
        bold: false,
        color: COLORS.text,
        sizeHalfPt: body,
        beforeTwip: 0,
        afterTwip: after,
        bullet: false,
        keepNext: false,
        keepLines: true,
      };
  }
}

function titleRowText(block: PlacedBlock): string {
  const title = block.lines
    .filter((line) => line.font.bold)
    .map((line) => line.text)
    .join(' ');
  const meta = block.lines
    .filter((line) => !line.font.bold)
    .map((line) => line.text)
    .join(' ');
  return `${title} ${meta}`;
}

function blockText(block: PlacedBlock): string {
  if (block.kind === 'titleRow') return titleRowText(block);
  const joined = block.lines.map((line) => line.text).join(' ');
  return block.kind === 'bullet' ? joined.replace(/^[•–▪]\s+/, '') : joined;
}

/**
 * Word can only express decorations as paragraph borders and shading, so the
 * layout's rectangle primitives are translated back into the nearest native
 * Word treatment. Fill headings use shading, bars use a left border, and
 * rules use top/bottom borders.
 */
function decorativeBorder(block: PlacedBlock): IParagraphOptions['border'] | undefined {
  const rule = block.rules?.[0] ?? block.rule;
  if (!block.decorKind || block.decorKind === 'none') {
    if (!rule) return undefined;
    return {
      bottom: {
        style: BorderStyle.SINGLE,
        size: Math.max(1, Math.round(rule.heightPt * 8)),
        color: hexColor(rule.color),
        space: 1,
      },
    };
  }
  const color = hexColor(rule?.color ?? COLORS.accent);
  const size = Math.max(1, Math.round((rule?.heightPt ?? 1) * 8));
  switch (block.decorKind) {
    case 'underline':
    case 'trailing':
      return { bottom: { style: BorderStyle.SINGLE, size, color, space: 2 } };
    case 'topRule':
      return { top: { style: BorderStyle.SINGLE, size, color, space: 2 } };
    case 'boxed':
      return {
        top: { style: BorderStyle.SINGLE, size, color, space: 2 },
        bottom: { style: BorderStyle.SINGLE, size, color, space: 2 },
      };
    case 'bar':
      return { left: { style: BorderStyle.SINGLE, size: Math.max(8, size * 3), color, space: 4 } };
    case 'fill':
    default:
      return undefined;
  }
}

function paragraphFor(
  block: PlacedBlock,
  metrics: ResolvedMetrics,
  firstInCell: boolean,
): Paragraph {
  const style = styleFor(block, metrics);
  const sourceFont = block.lines[0]?.font;
  const indentTwip = Math.round((block.indentLeftPt ?? 0) * PT_TO_TWIP);
  const tabStops =
    block.kind === 'titleRow'
      ? block.rowLayout === 'metaLeft'
        ? [{ type: TabStopType.LEFT, position: Math.max(1, indentTwip) }]
        : [{ type: TabStopType.RIGHT, position: Math.round(block.widthPt * PT_TO_TWIP) }]
      : undefined;

  const run = (text: string, font: FontSpec, color: string): TextRun =>
    new TextRun({
      text,
      bold: font.bold,
      size: Math.max(1, Math.round(font.sizePt * 2)),
      color: hexColor(color),
      font: docxFont(font),
      characterSpacing: font.letterSpacingPt
        ? Math.round(font.letterSpacingPt * PT_TO_TWIP)
        : undefined,
    });

  let children: (TextRun | Tab)[];
  if (block.kind === 'titleRow') {
    const titleLines = block.lines.filter((line) => line.font.bold);
    const metaLines = block.lines.filter((line) => !line.font.bold);
    const titleLine = titleLines[0] ?? block.lines[0];
    const metaLine = metaLines[0] ?? block.lines[block.lines.length - 1];
    const titleText = titleLines.map((line) => line.text).join(' ') || titleLine.text;
    const metaText = metaLines.map((line) => line.text).join(' ') || metaLine.text;
    const titleRun = run(titleText, titleLine.font, titleLine.color);
    const metaRun = run(metaText, metaLine.font, metaLine.color);
    children =
      block.rowLayout === 'metaLeft'
        ? [metaRun, new Tab(), titleRun]
        : [titleRun, new Tab(), metaRun];
  } else {
    children = [run(blockText(block), sourceFont ?? { sizePt: metrics.bodyPt }, style.color)];
  }

  return new Paragraph({
    children,
    spacing: {
      before: firstInCell ? 0 : style.beforeTwip,
      after: style.afterTwip,
      line: metrics.wordLineTwips,
      lineRule: LineRuleType.AUTO,
    },
    keepNext: style.keepNext,
    keepLines: style.keepLines,
    bullet: style.bullet ? { level: 0 } : undefined,
    indent: style.bullet
      ? { left: 360 + indentTwip, hanging: 180 }
      : indentTwip
        ? { left: indentTwip }
        : undefined,
    alignment: block.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
    border: decorativeBorder(block),
    shading: block.band
      ? { type: ShadingType.CLEAR, fill: hexColor(block.band.color), color: 'auto' }
      : undefined,
    tabStops,
  });
}

function emptyParagraph(): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.AUTO },
  });
}

const DIVIDER_BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'D5DED7' };

interface CellOptions {
  shading?: string;
  dividerSide?: 'left' | 'right';
}

function cell(
  blocks: PlacedBlock[],
  metrics: ResolvedMetrics,
  widthTwip: number,
  options: CellOptions = {},
): TableCell {
  const paragraphs = blocks.map((block, index) => paragraphFor(block, metrics, index === 0));
  if (paragraphs.length === 0) paragraphs.push(emptyParagraph());
  return new TableCell({
    children: paragraphs,
    width: { size: widthTwip, type: WidthType.DXA },
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: options.dividerSide === 'left' ? DIVIDER_BORDER : NO_BORDER,
      right: options.dividerSide === 'right' ? DIVIDER_BORDER : NO_BORDER,
    },
    shading: options.shading
      ? { type: ShadingType.CLEAR, fill: hexColor(options.shading), color: 'auto' }
      : undefined,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

function pageTable(page: PageLayout, metrics: ResolvedMetrics, layout: Layout): Table {
  const sidebarOnLeft = layout.sidebarSide === 'left';
  const boundaryPt = sidebarOnLeft
    ? metrics.marginXPt + metrics.sideWidthPt + metrics.gapPt / 2
    : metrics.marginXPt + metrics.mainWidthPt + metrics.gapPt / 2;
  const isSide = (block: PlacedBlock) =>
    sidebarOnLeft ? block.xPt < boundaryPt : block.xPt >= boundaryPt;
  const mainBlocks = page.blocks.filter((block) => !isSide(block));
  const sideBlocks = page.blocks.filter(isSide);
  const mainWidthTwip = Math.round(metrics.mainWidthPt * PT_TO_TWIP);
  const gapWidthTwip = Math.round(metrics.gapPt * PT_TO_TWIP);
  const sideWidthTwip = Math.round(metrics.sideWidthPt * PT_TO_TWIP);

  const dividerSide = layout.sidebarDivider ? (sidebarOnLeft ? 'right' : 'left') : undefined;
  const mainCell = cell(mainBlocks, metrics, mainWidthTwip);
  const sideCell = cell(sideBlocks, metrics, sideWidthTwip, {
    shading: layout.sidebarTint,
    dividerSide,
  });
  const gapCell = new TableCell({
    children: [emptyParagraph()],
    width: { size: gapWidthTwip, type: WidthType.DXA },
    borders: CELL_BORDERS,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const firstBlockTopPt =
    page.blocks.length > 0
      ? Math.min(...page.blocks.map((block) => block.yPt))
      : metrics.marginTopPt;
  const topPt = page.index === 0 ? firstBlockTopPt : metrics.marginTopPt;
  const rowHeightTwip = Math.max(
    0,
    Math.round((page.heightPt - metrics.marginBottomPt - topPt) * PT_TO_TWIP),
  );

  return new Table({
    width: {
      size: mainWidthTwip + gapWidthTwip + sideWidthTwip,
      type: WidthType.DXA,
    },
    columnWidths: [mainWidthTwip, gapWidthTwip, sideWidthTwip],
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        height: { value: rowHeightTwip, rule: HeightRule.ATLEAST },
        children: sidebarOnLeft ? [sideCell, gapCell, mainCell] : [mainCell, gapCell, sideCell],
      }),
    ],
  });
}

function contactValues(identity: DocumentIdentity): string[] {
  return [
    identity.contact.email,
    identity.contact.phone,
    identity.contact.location,
    ...identity.contact.links.map((link) => link.label),
  ].filter((part): part is string => Boolean(part));
}

function headerParagraphs(
  identity: DocumentIdentity,
  metrics: ResolvedMetrics,
  accent: string,
  layout: Layout,
  header: HeaderLayout | undefined,
): Paragraph[] {
  const family = docxFont(header?.name.font);
  const centered = layout.headerVariant === 'centered' || layout.headerAlign === 'center';
  const alignment = centered ? AlignmentType.CENTER : AlignmentType.LEFT;
  const nameSpacing = header?.name.font.letterSpacingPt ?? 0;
  const nameColor = hexColor(header?.name.color ?? accent);
  const contacts = header?.contactLines.length
    ? header.contactLines.map((line) => line.text)
    : (() => {
        const value = contactValues(identity).join('  ·  ');
        return value ? [value] : [];
      })();
  const contactSize = Math.round(metrics.smallPt * 2);
  const contactColor = hexColor(header?.contactLines[0]?.color ?? COLORS.muted);
  const contentWidthTwip = Math.round(metrics.contentWidthPt * PT_TO_TWIP);
  const nameSize = Math.round(metrics.namePt * 2);
  const headlineSize = Math.round(metrics.headlinePt * 2);
  const headlineColor = hexColor(header?.headline?.color ?? COLORS.text);

  const rule = header?.rule;
  const ruleBorder = rule
    ? {
        bottom: {
          style: BorderStyle.SINGLE,
          size: Math.max(1, Math.round(rule.widthPt * 8)),
          color: hexColor(rule.color),
          space: 4,
        },
      }
    : undefined;
  const secondBorder = header?.secondRule
    ? {
        bottom: {
          style: BorderStyle.SINGLE,
          size: Math.max(1, Math.round(header.secondRule.widthPt * 8)),
          color: hexColor(header.secondRule.color),
          space: 2,
        },
      }
    : undefined;

  const nameRun = () =>
    new TextRun({
      text: identity.name,
      bold: true,
      size: nameSize,
      color: nameColor,
      font: family,
      characterSpacing: nameSpacing ? Math.round(nameSpacing * PT_TO_TWIP) : undefined,
    });
  const headlineRun = (breakBefore = false) =>
    identity.headline
      ? new TextRun({
          text: identity.headline,
          break: breakBefore ? 1 : undefined,
          size: headlineSize,
          color: headlineColor,
          font: family,
        })
      : undefined;

  const paragraphs: Paragraph[] = [];

  if (layout.headerVariant === 'banner' && header?.band) {
    const shading = {
      type: ShadingType.CLEAR,
      fill: hexColor(header.band.color),
      color: 'auto' as const,
    };
    const runs = [nameRun()];
    const headline = identity.headline
      ? new TextRun({
          text: identity.headline,
          break: 1,
          size: headlineSize,
          color: hexColor(header.headline?.color ?? '#FFFFFF'),
          font: family,
        })
      : undefined;
    if (headline) runs.push(headline);
    paragraphs.push(
      new Paragraph({
        children: runs,
        spacing: { before: 120, after: 120, line: 240, lineRule: LineRuleType.AUTO },
        keepNext: true,
        alignment: AlignmentType.LEFT,
        shading,
      }),
    );
    if (contacts.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contacts.join('  ·  '),
              size: contactSize,
              color: contactColor,
              font: family,
            }),
          ],
          spacing: { before: 80, after: 180, line: 240, lineRule: LineRuleType.AUTO },
          alignment: AlignmentType.LEFT,
          border: ruleBorder,
        }),
      );
    }
    if (secondBorder) {
      paragraphs.push(
        new Paragraph({ children: [], spacing: { after: 0, line: 20 }, border: secondBorder }),
      );
    }
    return paragraphs;
  }

  if (layout.headerVariant === 'split' || layout.headerVariant === 'compact') {
    const tabStops = [{ type: TabStopType.RIGHT, position: contentWidthTwip }];
    const firstChildren: TextRun[] = [nameRun()];
    if (layout.headerVariant === 'compact') {
      const inline = headlineRun(false);
      if (inline) firstChildren.push(new TextRun({ text: '  ' }), inline);
    }
    const firstContact = contacts[0];
    if (firstContact) {
      firstChildren.push(
        new TextRun({
          text: `\t${firstContact}`,
          size: contactSize,
          color: contactColor,
          font: family,
        }),
      );
    }
    paragraphs.push(
      new Paragraph({
        children: firstChildren,
        spacing: { after: 40, line: 240, lineRule: LineRuleType.AUTO },
        keepNext: true,
        alignment: AlignmentType.LEFT,
        tabStops,
      }),
    );

    let contactIndex = 1;
    if (layout.headerVariant === 'split') {
      const headline = headlineRun(false);
      if (headline) {
        const contact = contacts[contactIndex];
        paragraphs.push(
          new Paragraph({
            children: [
              headline,
              ...(contact
                ? [
                    new TextRun({
                      text: `\t${contact}`,
                      size: contactSize,
                      color: contactColor,
                      font: family,
                    }),
                  ]
                : []),
            ],
            spacing: { after: 40, line: 240, lineRule: LineRuleType.AUTO },
            keepNext: true,
            alignment: AlignmentType.LEFT,
            tabStops,
          }),
        );
        if (contact) contactIndex += 1;
      }
    }

    for (; contactIndex < contacts.length; contactIndex += 1) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contacts[contactIndex],
              size: contactSize,
              color: contactColor,
              font: family,
            }),
          ],
          spacing: { after: 40, line: 240, lineRule: LineRuleType.AUTO },
          keepNext: true,
          alignment: AlignmentType.RIGHT,
        }),
      );
    }

    if (ruleBorder) {
      paragraphs.push(
        new Paragraph({
          children: [],
          spacing: { after: 120, line: 20, lineRule: LineRuleType.AUTO },
          border: ruleBorder,
        }),
      );
    }
    if (secondBorder) {
      paragraphs.push(
        new Paragraph({ children: [], spacing: { after: 0, line: 20 }, border: secondBorder }),
      );
    }
    return paragraphs;
  }

  paragraphs.push(
    new Paragraph({
      children: [nameRun()],
      spacing: { after: 60, line: 240, lineRule: LineRuleType.AUTO },
      keepNext: true,
      alignment,
      border: ruleBorder && !identity.headline && contacts.length === 0 ? ruleBorder : undefined,
    }),
  );

  const headline = headlineRun(false);
  if (headline) {
    paragraphs.push(
      new Paragraph({
        children: [headline],
        spacing: { after: 40, line: 240, lineRule: LineRuleType.AUTO },
        keepNext: true,
        alignment,
        border: ruleBorder && contacts.length === 0 ? ruleBorder : undefined,
      }),
    );
  }

  if (contacts.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contacts.join('  ·  '),
            size: contactSize,
            color: contactColor,
            font: family,
          }),
        ],
        spacing: { after: 180, line: 240, lineRule: LineRuleType.AUTO },
        alignment,
        border: ruleBorder,
      }),
    );
  }

  if (secondBorder) {
    paragraphs.push(
      new Paragraph({ children: [], spacing: { after: 0, line: 20 }, border: secondBorder }),
    );
  }

  return paragraphs;
}

function pageBreakParagraph(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
    spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.AUTO },
  });
}

function pageProperties(metrics: ResolvedMetrics): ISectionOptions['properties'] {
  return {
    page: {
      size: {
        width: Math.round(metrics.pageWidthPt * PT_TO_TWIP),
        height: Math.round(metrics.pageHeightPt * PT_TO_TWIP),
      },
      margin: {
        top: Math.round(metrics.marginTopPt * PT_TO_TWIP),
        bottom: Math.round(metrics.marginBottomPt * PT_TO_TWIP),
        left: Math.round(metrics.marginXPt * PT_TO_TWIP),
        right: Math.round(metrics.marginXPt * PT_TO_TWIP),
      },
    },
  };
}

function baseDocument(
  children: (Paragraph | Table)[],
  metrics: ResolvedMetrics,
  title: string,
  fontFamily: 'helvetica' | 'times' = 'helvetica',
): Document {
  return new Document({
    creator: 'OpenResume',
    title,
    description: 'Generated by OpenResume',
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily === 'times' ? 'Times New Roman' : 'Helvetica',
            size: Math.round(metrics.bodyPt * 2),
          },
        },
      },
    },
    sections: [
      {
        properties: pageProperties(metrics),
        children,
      },
    ],
  });
}

function resumeChildren(resume: Resume, layout: Layout): (Paragraph | Table)[] {
  const { metrics } = layout;
  const children: (Paragraph | Table)[] = [
    ...headerParagraphs(
      {
        name: resume.header.name,
        headline: resume.header.headline,
        contact: resume.contact,
      },
      metrics,
      layout.accent,
      layout,
      layout.pages[0]?.header,
    ),
  ];

  // Single-column designs are deliberately linear: one paragraph flow, no
  // table cells, so Word and text extractors see conventional reading order.
  const useTable = layout.columns === 2;

  layout.pages.forEach((page, index) => {
    if (index > 0) children.push(pageBreakParagraph());
    if (useTable) {
      children.push(pageTable(page, metrics, layout));
      return;
    }
    const paragraphs = page.blocks.map((block, blockIndex) =>
      paragraphFor(block, metrics, blockIndex === 0),
    );
    if (paragraphs.length === 0) paragraphs.push(emptyParagraph());
    children.push(...paragraphs);
  });

  return children;
}

function coverLetterChildren(letter: CoverLetter, layout: Layout): (Paragraph | Table)[] {
  const { metrics } = layout;
  const children: (Paragraph | Table)[] = [
    ...headerParagraphs(
      {
        name: letter.applicant.name,
        headline: letter.applicant.headline,
        contact: letter.applicant.contact,
      },
      metrics,
      layout.accent,
      layout,
      layout.pages[0]?.header,
    ),
  ];

  layout.pages.forEach((page, index) => {
    if (index > 0) children.push(pageBreakParagraph());
    const paragraphs = page.blocks.map((block, blockIndex) =>
      paragraphFor(block, metrics, blockIndex === 0),
    );
    if (paragraphs.length === 0) paragraphs.push(emptyParagraph());
    children.push(...paragraphs);
  });

  return children;
}

function samePageGeometry(first: ResolvedMetrics, second: ResolvedMetrics): boolean {
  return (
    Math.abs(first.pageWidthPt - second.pageWidthPt) < 0.01 &&
    Math.abs(first.pageHeightPt - second.pageHeightPt) < 0.01 &&
    Math.abs(first.marginTopPt - second.marginTopPt) < 0.01 &&
    Math.abs(first.marginBottomPt - second.marginBottomPt) < 0.01 &&
    Math.abs(first.marginXPt - second.marginXPt) < 0.01
  );
}

export function createDocxDocument(resume: Resume, layout: Layout): Document {
  return baseDocument(
    resumeChildren(resume, layout),
    layout.metrics,
    `${resume.header.name || 'Resume'} — Resume`,
    layout.fontFamily,
  );
}

export function createCoverLetterDocxDocument(letter: CoverLetter, layout: Layout): Document {
  return baseDocument(
    coverLetterChildren(letter, layout),
    layout.metrics,
    `${letter.applicant.name || 'Cover Letter'} — Cover Letter`,
    layout.fontFamily,
  );
}

interface KitPart {
  content: (Paragraph | Table)[];
  metrics: ResolvedMetrics;
}

export function createApplicationKitDocxDocument(
  resume: Resume,
  resumeLayout: Layout,
  letter: CoverLetter,
  letterLayout: Layout,
  order: ApplicationKitOrder = DEFAULT_APPLICATION_KIT_ORDER,
): Document {
  const letterPart: KitPart = {
    content: coverLetterChildren(letter, letterLayout),
    metrics: letterLayout.metrics,
  };
  const resumePart: KitPart = {
    content: resumeChildren(resume, resumeLayout),
    metrics: resumeLayout.metrics,
  };
  const parts = order === 'resumeFirst' ? [resumePart, letterPart] : [letterPart, resumePart];
  const [firstPart, secondPart] = parts;
  const useSingleSection = samePageGeometry(firstPart.metrics, secondPart.metrics);

  const sections: ISectionOptions[] = useSingleSection
    ? [
        {
          properties: pageProperties(firstPart.metrics),
          children: [...firstPart.content, pageBreakParagraph(), ...secondPart.content],
        },
      ]
    : [
        {
          properties: pageProperties(firstPart.metrics),
          children: firstPart.content,
        },
        {
          properties: {
            type: SectionType.NEXT_PAGE,
            ...pageProperties(secondPart.metrics),
          },
          children: secondPart.content,
        },
      ];

  return new Document({
    creator: 'OpenResume',
    title: `${resume.header.name || 'Application'} — Application Kit`,
    description: 'Generated by OpenResume',
    styles: {
      default: {
        document: {
          run: {
            font: resumeLayout.fontFamily === 'times' ? 'Times New Roman' : 'Helvetica',
            size: Math.round(firstPart.metrics.bodyPt * 2),
          },
        },
      },
    },
    sections,
  });
}

export async function exportDocx(resume: Resume, layout: Layout): Promise<Blob> {
  const document = createDocxDocument(resume, layout);
  return Packer.toBlob(document);
}

export async function exportCoverLetterDocx(letter: CoverLetter, layout: Layout): Promise<Blob> {
  const document = createCoverLetterDocxDocument(letter, layout);
  return Packer.toBlob(document);
}

export async function exportApplicationKitDocx(
  resume: Resume,
  resumeLayout: Layout,
  letter: CoverLetter,
  letterLayout: Layout,
  order: ApplicationKitOrder = DEFAULT_APPLICATION_KIT_ORDER,
): Promise<Blob> {
  const document = createApplicationKitDocxDocument(
    resume,
    resumeLayout,
    letter,
    letterLayout,
    order,
  );
  return Packer.toBlob(document);
}

function textContentFrom(identity: DocumentIdentity, layout: Layout): string[] {
  const texts: string[] = [identity.name];
  if (identity.headline) texts.push(identity.headline);
  for (const value of [
    identity.contact.email,
    identity.contact.phone,
    identity.contact.location,
    ...identity.contact.links.map((link) => link.label),
  ]) {
    if (value) texts.push(value);
  }

  for (const page of layout.pages) {
    for (const block of page.blocks) {
      const text = blockText(block).replace(/\s+/g, ' ').trim();
      if (text) texts.push(text);
    }
  }
  return texts;
}

export function docxTextContent(resume: Resume, layout: Layout): string[] {
  return textContentFrom(
    {
      name: resume.header.name,
      headline: resume.header.headline,
      contact: resume.contact,
    },
    layout,
  );
}

export function coverLetterDocxTextContent(letter: CoverLetter, layout: Layout): string[] {
  return textContentFrom(
    {
      name: letter.applicant.name,
      headline: letter.applicant.headline,
      contact: letter.applicant.contact,
    },
    layout,
  );
}
