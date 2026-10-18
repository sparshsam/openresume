import { measureLineWidth, wrapText, type FontSpec } from './measure';
import { resolveMetrics, type ResolvedMetrics } from './metrics';
import { paginateColumn, type BlockKind, type FlowBlock, type PlacedBlock } from './paginate';
import { LIST_KINDS } from './parse';
import { COLORS } from './tokens';
import type { DocumentKind } from '../types/document';
import type { ColumnId, Contact, Resume, ResumeItem, ResumeSection } from '../types/resume';

export interface HeaderLine {
  text: string;
  xPt: number;
  yPt: number;
  font: FontSpec;
  color: string;
}

export interface HeaderLayout {
  name: HeaderLine;
  headline?: HeaderLine;
  contactLines: HeaderLine[];
  rule: { x1Pt: number; y1Pt: number; x2Pt: number; y2Pt: number; widthPt: number; color: string };
}

export interface PageLayout {
  index: number;
  widthPt: number;
  heightPt: number;
  blocks: PlacedBlock[];
  header?: HeaderLayout;
}

export interface Layout {
  kind: DocumentKind;
  pages: PageLayout[];
  pageWidthPt: number;
  pageHeightPt: number;
  pageSizeLabel: string;
  metrics: ResolvedMetrics;
}

export interface DocumentIdentity {
  name: string;
  headline?: string;
  contact: Contact;
}

const BULLET_PREFIX = '•  ';

function bodyFont(metrics: ResolvedMetrics): FontSpec {
  return { sizePt: metrics.bodyPt };
}

function boldFont(metrics: ResolvedMetrics): FontSpec {
  return { sizePt: metrics.bodyPt, bold: true };
}

function smallFont(metrics: ResolvedMetrics): FontSpec {
  return { sizePt: metrics.smallPt };
}

function headingFont(metrics: ResolvedMetrics): FontSpec {
  return { sizePt: metrics.headingPt, bold: true };
}

export function buildDocumentHeader(
  identity: DocumentIdentity,
  metrics: ResolvedMetrics,
): { header: HeaderLayout; heightPt: number } {
  const name: HeaderLine = {
    text: identity.name,
    xPt: metrics.marginXPt,
    yPt: metrics.marginTopPt,
    font: { sizePt: metrics.namePt, bold: true },
    color: COLORS.accent,
  };

  let cursor = metrics.marginTopPt + metrics.nameLinePt;
  let headline: HeaderLine | undefined;

  if (identity.headline) {
    const yPt = cursor + 4;
    headline = {
      text: identity.headline,
      xPt: metrics.marginXPt,
      yPt,
      font: { sizePt: metrics.headlinePt },
      color: COLORS.text,
    };
    cursor = yPt + metrics.headlineLinePt;
  }

  const contactParts = [
    identity.contact.email,
    identity.contact.phone,
    identity.contact.location,
    ...identity.contact.links.map((link) => link.label),
  ].filter((part): part is string => Boolean(part));
  const contactText = contactParts.join('  ·  ');
  const contactRows = contactText
    ? wrapText(contactText, metrics.contentWidthPt, smallFont(metrics))
    : [];

  const contactTop = cursor + (contactRows.length > 0 ? 8 : 0);
  const contactLines = contactRows.map((text, index) => ({
    text,
    xPt: metrics.marginXPt,
    yPt: contactTop + index * metrics.smallLinePt,
    font: smallFont(metrics),
    color: COLORS.muted,
  }));

  cursor = contactTop + contactRows.length * metrics.smallLinePt;
  const ruleY = cursor + 10;
  const columnTop = ruleY + 10;

  return {
    header: {
      name,
      headline,
      contactLines,
      rule: {
        x1Pt: metrics.marginXPt,
        y1Pt: ruleY,
        x2Pt: metrics.pageWidthPt - metrics.marginXPt,
        y2Pt: ruleY,
        widthPt: 1.2,
        color: COLORS.accent,
      },
    },
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

function bulletBlock(
  text: string,
  widthPt: number,
  metrics: ResolvedMetrics,
  sectionId: string,
  itemId?: string,
): FlowBlock {
  const font = bodyFont(metrics);
  const indentPt = measureLineWidth(BULLET_PREFIX, font) + 1;
  const bodyLines = wrapText(text, widthPt - indentPt, font);
  const lines = bodyLines.map((line, index) => ({
    text: index === 0 ? `${BULLET_PREFIX}${line}` : line,
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

function headingBlock(section: ResumeSection, first: boolean, metrics: ResolvedMetrics): FlowBlock {
  return {
    sectionId: section.id,
    kind: 'heading',
    lineHeightPt: metrics.headingLinePt,
    spaceBeforePt: first ? 0 : metrics.sectionBeforePt,
    spaceAfterPt: metrics.sectionAfterPt,
    splittable: false,
    keepWithNext: true,
    lines: [
      {
        text: section.title.toUpperCase(),
        xOffsetPt: 0,
        font: headingFont(metrics),
        color: COLORS.accent,
      },
    ],
  };
}

function itemBlocks(
  section: ResumeSection,
  item: ResumeItem,
  widthPt: number,
  metrics: ResolvedMetrics,
  first: boolean,
): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  const before = first ? 0 : metrics.itemBeforePt;

  if (section.kind === 'skills') {
    if (item.title) {
      blocks.push(
        textBlock(item.title, widthPt, {
          kind: 'skillLabel',
          sectionId: section.id,
          itemId: item.id,
          font: boldFont(metrics),
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
          font: bodyFont(metrics),
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
        blocks.push(bulletBlock(text, widthPt, metrics, section.id, item.id));
      } else {
        blocks.push(
          textBlock(text, widthPt, {
            kind: 'listItem',
            sectionId: section.id,
            itemId: item.id,
            font: bodyFont(metrics),
            color: COLORS.text,
            lineHeightPt: metrics.bodyLinePt,
            spaceBeforePt: before,
            spaceAfterPt: metrics.paragraphAfterPt,
          }),
        );
      }
    }
    for (const bullet of item.bullets) {
      blocks.push(bulletBlock(bullet, widthPt, metrics, section.id, item.id));
    }
    return blocks;
  }

  if (item.title) {
    blocks.push(
      textBlock(item.title, widthPt, {
        kind: 'title',
        sectionId: section.id,
        itemId: item.id,
        font: boldFont(metrics),
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
        kind: 'subtitle',
        sectionId: section.id,
        itemId: item.id,
        font: bodyFont(metrics),
        color: COLORS.text,
        lineHeightPt: metrics.bodyLinePt,
        spaceBeforePt: item.title ? 0 : before,
        spaceAfterPt: 0,
        keepWithNext: Boolean(
          item.dateRange || item.location || item.body || item.bullets.length > 0,
        ),
      }),
    );
  }

  const meta = [item.dateRange, item.location].filter(Boolean).join('  ·  ');
  if (meta) {
    blocks.push(
      textBlock(meta, widthPt, {
        kind: 'meta',
        sectionId: section.id,
        itemId: item.id,
        font: smallFont(metrics),
        color: COLORS.muted,
        lineHeightPt: metrics.smallLinePt,
        spaceBeforePt: item.title || item.subtitle ? 1.5 : before,
        spaceAfterPt: 2,
        keepWithNext: Boolean(item.body || item.bullets.length > 0),
        splittable: false,
      }),
    );
  }

  if (item.body) {
    blocks.push(
      textBlock(item.body, widthPt, {
        kind: 'body',
        sectionId: section.id,
        itemId: item.id,
        font: bodyFont(metrics),
        color: COLORS.text,
        lineHeightPt: metrics.bodyLinePt,
        spaceBeforePt: item.title || item.subtitle || meta ? 0 : before,
        spaceAfterPt: metrics.paragraphAfterPt,
      }),
    );
  }

  for (const bullet of item.bullets) {
    blocks.push(bulletBlock(bullet, widthPt, metrics, section.id, item.id));
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

function buildColumnBlocks(
  resume: Resume,
  column: ColumnId,
  metrics: ResolvedMetrics,
): FlowBlock[] {
  const widthPt = column === 'main' ? metrics.mainWidthPt : metrics.sideWidthPt;
  const blocks: FlowBlock[] = [];
  let first = true;

  for (const section of resume.sections) {
    if (!section.enabled || section.column !== column || !hasContent(section)) continue;

    blocks.push(headingBlock(section, first, metrics));
    first = false;

    if (section.kind === 'summary' || section.kind === 'custom') {
      section.items.forEach((item, itemIndex) => {
        if (item.body) {
          blocks.push(
            textBlock(item.body, widthPt, {
              kind: 'body',
              sectionId: section.id,
              itemId: item.id,
              font: bodyFont(metrics),
              color: COLORS.text,
              lineHeightPt: metrics.bodyLinePt,
              spaceBeforePt: itemIndex === 0 ? 0 : metrics.itemBeforePt,
              spaceAfterPt: metrics.paragraphAfterPt,
            }),
          );
        }
        for (const bullet of item.bullets) {
          blocks.push(bulletBlock(bullet, widthPt, metrics, section.id, item.id));
        }
      });
      continue;
    }

    section.items.forEach((item, itemIndex) => {
      blocks.push(...itemBlocks(section, item, widthPt, metrics, itemIndex === 0));
    });
  }

  return blocks;
}

export function translatePlacedBlock(block: PlacedBlock, xPt: number, yPt: number): PlacedBlock {
  return {
    ...block,
    xPt: block.xPt + xPt,
    yPt: block.yPt + yPt,
    lines: block.lines.map((line) => ({
      ...line,
      xPt: line.xPt + xPt,
      yPt: line.yPt + yPt,
    })),
  };
}

export function layoutResume(resume: Resume): Layout {
  const metrics = resolveMetrics(resume.template);
  const { header, heightPt: headerHeightPt } = buildDocumentHeader(
    {
      name: resume.header.name,
      headline: resume.header.headline,
      contact: resume.contact,
    },
    metrics,
  );

  const firstCapacityPt =
    metrics.pageHeightPt - metrics.marginTopPt - headerHeightPt - metrics.marginBottomPt;
  const restCapacityPt = metrics.pageHeightPt - metrics.marginTopPt - metrics.marginBottomPt;

  const mainBlocks = buildColumnBlocks(resume, 'main', metrics);
  const sideBlocks = buildColumnBlocks(resume, 'side', metrics);

  const mainPages = paginateColumn(
    mainBlocks,
    firstCapacityPt,
    restCapacityPt,
    metrics.mainWidthPt,
  );
  const sidePages = paginateColumn(
    sideBlocks,
    firstCapacityPt,
    restCapacityPt,
    metrics.sideWidthPt,
  );

  const pageCount = Math.max(1, mainPages.length, sidePages.length);
  const sideX = metrics.marginXPt + metrics.mainWidthPt + metrics.gapPt;

  const pages: PageLayout[] = Array.from({ length: pageCount }, (_, index) => {
    const top = metrics.marginTopPt + (index === 0 ? headerHeightPt : 0);
    const blocks = [
      ...(mainPages[index] ?? []).map((block) =>
        translatePlacedBlock(block, metrics.marginXPt, top),
      ),
      ...(sidePages[index] ?? []).map((block) => translatePlacedBlock(block, sideX, top)),
    ];
    return {
      index,
      widthPt: metrics.pageWidthPt,
      heightPt: metrics.pageHeightPt,
      blocks,
      header: index === 0 ? header : undefined,
    };
  });

  const contentPages = pages.filter((page) => page.blocks.length > 0 || page.header);
  const finalPages = contentPages.length > 0 ? contentPages : pages.slice(0, 1);
  finalPages.forEach((page, index) => {
    page.index = index;
  });

  return {
    kind: 'resume',
    pages: finalPages,
    pageWidthPt: metrics.pageWidthPt,
    pageHeightPt: metrics.pageHeightPt,
    pageSizeLabel: metrics.pageSizeLabel,
    metrics,
  };
}
