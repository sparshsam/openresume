import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DocumentIdentity, Layout, PageLayout } from './layout';
import type { ResolvedMetrics } from './metrics';
import type { PlacedBlock } from './paginate';
import { COLORS } from './tokens';
import type { CoverLetter } from '../types/coverLetter';
import type { Resume } from '../types/resume';

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
        color: COLORS.accent,
        sizeHalfPt: heading,
        beforeTwip: Math.round(metrics.sectionBeforePt * PT_TO_TWIP),
        afterTwip: Math.round(metrics.sectionAfterPt * PT_TO_TWIP),
        bullet: false,
        keepNext: true,
        keepLines: true,
      };
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

function blockText(block: PlacedBlock): string {
  const joined = block.lines.map((line) => line.text).join(' ');
  return block.kind === 'bullet' ? joined.replace(/^•\s+/, '') : joined;
}

function paragraphFor(
  block: PlacedBlock,
  metrics: ResolvedMetrics,
  firstInCell: boolean,
): Paragraph {
  const style = styleFor(block, metrics);
  return new Paragraph({
    children: [
      new TextRun({
        text: blockText(block),
        bold: style.bold,
        size: style.sizeHalfPt,
        color: hexColor(style.color),
        font: 'Helvetica',
      }),
    ],
    spacing: {
      before: firstInCell ? 0 : style.beforeTwip,
      after: style.afterTwip,
      line: metrics.wordLineTwips,
      lineRule: LineRuleType.AUTO,
    },
    keepNext: style.keepNext,
    keepLines: style.keepLines,
    bullet: style.bullet ? { level: 0 } : undefined,
    indent: style.bullet ? { left: 360, hanging: 180 } : undefined,
    alignment: AlignmentType.LEFT,
  });
}

function emptyParagraph(): Paragraph {
  return new Paragraph({
    children: [],
    spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.AUTO },
  });
}

function cell(blocks: PlacedBlock[], metrics: ResolvedMetrics, widthTwip: number): TableCell {
  const paragraphs = blocks.map((block, index) => paragraphFor(block, metrics, index === 0));
  if (paragraphs.length === 0) paragraphs.push(emptyParagraph());
  return new TableCell({
    children: paragraphs,
    width: { size: widthTwip, type: WidthType.DXA },
    borders: CELL_BORDERS,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });
}

function pageTable(page: PageLayout, metrics: ResolvedMetrics): Table {
  const sideStartX = metrics.marginXPt + metrics.mainWidthPt + metrics.gapPt;
  const mainBlocks = page.blocks.filter((block) => block.xPt < sideStartX);
  const sideBlocks = page.blocks.filter((block) => block.xPt >= sideStartX);
  const mainWidthTwip = Math.round(metrics.mainWidthPt * PT_TO_TWIP);
  const gapWidthTwip = Math.round(metrics.gapPt * PT_TO_TWIP);
  const sideWidthTwip = Math.round(metrics.sideWidthPt * PT_TO_TWIP);

  return new Table({
    width: {
      size: mainWidthTwip + gapWidthTwip + sideWidthTwip,
      type: WidthType.DXA,
    },
    columnWidths: [mainWidthTwip, gapWidthTwip, sideWidthTwip],
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          cell(mainBlocks, metrics, mainWidthTwip),
          new TableCell({
            children: [emptyParagraph()],
            width: { size: gapWidthTwip, type: WidthType.DXA },
            borders: CELL_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
          }),
          cell(sideBlocks, metrics, sideWidthTwip),
        ],
      }),
    ],
  });
}

function headerParagraphs(
  identity: DocumentIdentity,
  metrics: ResolvedMetrics,
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: identity.name,
          bold: true,
          size: Math.round(metrics.namePt * 2),
          color: hexColor(COLORS.accent),
          font: 'Helvetica',
        }),
      ],
      spacing: { after: 60, line: 240, lineRule: LineRuleType.AUTO },
      keepNext: true,
    }),
  ];

  if (identity.headline) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: identity.headline,
            size: Math.round(metrics.headlinePt * 2),
            color: hexColor(COLORS.text),
            font: 'Helvetica',
          }),
        ],
        spacing: { after: 40, line: 240, lineRule: LineRuleType.AUTO },
        keepNext: true,
      }),
    );
  }

  const contact = [
    identity.contact.email,
    identity.contact.phone,
    identity.contact.location,
    ...identity.contact.links.map((link) => link.label),
  ]
    .filter((part): part is string => Boolean(part))
    .join('  ·  ');

  if (contact) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contact,
            size: Math.round(metrics.smallPt * 2),
            color: hexColor(COLORS.muted),
            font: 'Helvetica',
          }),
        ],
        spacing: { after: 180, line: 240, lineRule: LineRuleType.AUTO },
      }),
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

function baseDocument(
  children: (Paragraph | Table)[],
  metrics: ResolvedMetrics,
  title: string,
): Document {
  return new Document({
    creator: 'OpenResume',
    title,
    description: 'Generated by OpenResume',
    styles: {
      default: {
        document: {
          run: { font: 'Helvetica', size: Math.round(metrics.bodyPt * 2) },
        },
      },
    },
    sections: [
      {
        properties: {
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
        },
        children,
      },
    ],
  });
}

export function createDocxDocument(resume: Resume, layout: Layout): Document {
  const { metrics } = layout;
  const children: (Paragraph | Table)[] = [
    ...headerParagraphs(
      {
        name: resume.header.name,
        headline: resume.header.headline,
        contact: resume.contact,
      },
      metrics,
    ),
  ];

  layout.pages.forEach((page, index) => {
    if (index > 0) children.push(pageBreakParagraph());
    children.push(pageTable(page, metrics));
  });

  return baseDocument(children, metrics, `${resume.header.name || 'Resume'} — Resume`);
}

export function createCoverLetterDocxDocument(
  letter: CoverLetter,
  layout: Layout,
): Document {
  const { metrics } = layout;
  const children: (Paragraph | Table)[] = [
    ...headerParagraphs(
      {
        name: letter.applicant.name,
        headline: letter.applicant.headline,
        contact: letter.applicant.contact,
      },
      metrics,
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

  return baseDocument(
    children,
    metrics,
    `${letter.applicant.name || 'Cover Letter'} — Cover Letter`,
  );
}

export async function exportDocx(resume: Resume, layout: Layout): Promise<Blob> {
  const document = createDocxDocument(resume, layout);
  return Packer.toBlob(document);
}

export async function exportCoverLetterDocx(
  letter: CoverLetter,
  layout: Layout,
): Promise<Blob> {
  const document = createCoverLetterDocxDocument(letter, layout);
  return Packer.toBlob(document);
}

function textContentFrom(
  identity: DocumentIdentity,
  layout: Layout,
): string[] {
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

export function coverLetterDocxTextContent(
  letter: CoverLetter,
  layout: Layout,
): string[] {
  return textContentFrom(
    {
      name: letter.applicant.name,
      headline: letter.applicant.headline,
      contact: letter.applicant.contact,
    },
    layout,
  );
}
