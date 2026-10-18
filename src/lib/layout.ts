import { measureLineWidth, wrapText, type FontSpec } from './measure';
import { paginateColumn, type FlowBlock, type PlacedBlock } from './paginate';
import { COLORS, COLUMNS, HEADER, MARGIN, PAGE, SPACING, TYPE } from './tokens';
import type { ColumnId, Resume, ResumeItem, ResumeSection } from '../types/resume';
import { LIST_KINDS } from './parse';

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
  pages: PageLayout[];
  pageWidthPt: number;
  pageHeightPt: number;
}

const BODY: FontSpec = { sizePt: TYPE.bodyPt };
const BODY_BOLD: FontSpec = { sizePt: TYPE.bodyPt, bold: true };
const SMALL: FontSpec = { sizePt: TYPE.smallPt };
const HEADING: FontSpec = { sizePt: TYPE.headingPt, bold: true };

const BULLET_PREFIX = '•  ';

function headerLayout(resume: Resume): HeaderLayout {
  const name: HeaderLine = {
    text: resume.header.name,
    xPt: MARGIN.xPt,
    yPt: MARGIN.topPt + HEADER.nameTopPt,
    font: { sizePt: TYPE.namePt, bold: true },
    color: COLORS.accent,
  };

  let cursor = MARGIN.topPt + HEADER.nameTopPt + TYPE.nameLinePt;
  let headline: HeaderLine | undefined;

  if (resume.header.headline) {
    cursor += HEADER.headlineGapPt - TYPE.nameLinePt;
    headline = {
      text: resume.header.headline,
      xPt: MARGIN.xPt,
      yPt: cursor,
      font: { sizePt: TYPE.headlinePt },
      color: COLORS.text,
    };
    cursor += TYPE.headlineLinePt;
  }

  const contactParts = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    ...resume.contact.links.map((link) => link.label),
  ].filter((part): part is string => Boolean(part));
  const contactText = contactParts.join('  ·  ');
  const contactWidth = PAGE.widthPt - MARGIN.xPt * 2;
  const contactRows = contactText ? wrapText(contactText, contactWidth, SMALL) : [];

  const contactTop = cursor + (headline ? HEADER.contactGapPt : HEADER.contactGapPt - 4);
  const contactLines = contactRows.map((text, index) => ({
    text,
    xPt: MARGIN.xPt,
    yPt: contactTop + index * TYPE.smallLinePt,
    font: SMALL,
    color: COLORS.muted,
  }));

  const ruleY = MARGIN.topPt + HEADER.heightPt - 12;

  return {
    name,
    headline,
    contactLines,
    rule: {
      x1Pt: MARGIN.xPt,
      y1Pt: ruleY,
      x2Pt: PAGE.widthPt - MARGIN.xPt,
      y2Pt: ruleY,
      widthPt: 1.2,
      color: COLORS.accent,
    },
  };
}

function headingBlock(section: ResumeSection, first: boolean): FlowBlock {
  return {
    sectionId: section.id,
    lineHeightPt: TYPE.headingLinePt,
    spaceBeforePt: first ? 0 : SPACING.sectionBeforePt,
    spaceAfterPt: SPACING.sectionAfterPt,
    splittable: false,
    keepWithNext: true,
    lines: [
      {
        text: section.title.toUpperCase(),
        xOffsetPt: 0,
        font: HEADING,
        color: COLORS.accent,
      },
    ],
  };
}

function textBlock(
  text: string,
  widthPt: number,
  options: {
    font?: FontSpec;
    color?: string;
    lineHeightPt?: number;
    spaceBeforePt?: number;
    spaceAfterPt?: number;
    splittable?: boolean;
    keepWithNext?: boolean;
    sectionId: string;
    itemId?: string;
    xOffsetPt?: number;
  },
): FlowBlock[] {
  const font = options.font ?? BODY;
  const lineHeightPt = options.lineHeightPt ?? TYPE.bodyLinePt;
  const xOffsetPt = options.xOffsetPt ?? 0;
  const lines = wrapText(text, widthPt - xOffsetPt, font).map((line) => ({
    text: line,
    xOffsetPt,
    font,
    color: options.color ?? COLORS.text,
  }));
  return [
    {
      sectionId: options.sectionId,
      itemId: options.itemId,
      lineHeightPt,
      lines,
      spaceBeforePt: options.spaceBeforePt ?? 0,
      spaceAfterPt: options.spaceAfterPt ?? 0,
      splittable: options.splittable ?? true,
      keepWithNext: options.keepWithNext,
    },
  ];
}

function bulletBlocks(
  text: string,
  widthPt: number,
  sectionId: string,
  itemId: string,
): FlowBlock[] {
  const indentPt = measureLineWidth(BULLET_PREFIX, BODY) + 1;
  const bodyLines = wrapText(text, widthPt - indentPt, BODY);
  const lines = bodyLines.map((line, index) => ({
    text: index === 0 ? `${BULLET_PREFIX}${line}` : line,
    xOffsetPt: index === 0 ? 0 : indentPt,
    font: BODY,
    color: COLORS.text,
  }));
  return [
    {
      sectionId,
      itemId,
      lineHeightPt: TYPE.bodyLinePt,
      lines,
      spaceBeforePt: 0,
      spaceAfterPt: SPACING.bulletAfterPt,
      splittable: true,
    },
  ];
}

function itemBlocks(
  section: ResumeSection,
  item: ResumeItem,
  widthPt: number,
  first: boolean,
): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  const spaceBeforePt = first ? 0 : SPACING.itemBeforePt;

  if (section.kind === 'skills') {
    if (item.title) {
      blocks.push(
        ...textBlock(item.title, widthPt, {
          font: BODY_BOLD,
          spaceBeforePt,
          spaceAfterPt: 0,
          keepWithNext: true,
          splittable: false,
          sectionId: section.id,
          itemId: item.id,
        }),
      );
    }
    if (item.subtitle) {
      blocks.push(
        ...textBlock(item.subtitle, widthPt, {
          spaceBeforePt: item.title ? 0 : spaceBeforePt,
          spaceAfterPt: SPACING.skillAfterPt,
          sectionId: section.id,
          itemId: item.id,
        }),
      );
    }
    return blocks;
  }

  if (LIST_KINDS.has(section.kind)) {
    const text = item.body ?? item.title ?? '';
    if (text) {
      if (section.kind === 'languages' || section.kind === 'interests') {
        blocks.push(...bulletBlocks(text, widthPt, section.id, item.id));
      } else {
        blocks.push(
          ...textBlock(text, widthPt, {
            spaceBeforePt,
            spaceAfterPt: 2,
            sectionId: section.id,
            itemId: item.id,
          }),
        );
      }
    }
    for (const bullet of item.bullets) {
      blocks.push(...bulletBlocks(bullet, widthPt, section.id, item.id));
    }
    return blocks;
  }

  if (item.title) {
    blocks.push(
      ...textBlock(item.title, widthPt, {
        font: BODY_BOLD,
        spaceBeforePt,
        spaceAfterPt: 0,
        keepWithNext: true,
        splittable: false,
        sectionId: section.id,
        itemId: item.id,
      }),
    );
  }

  if (item.subtitle) {
    blocks.push(
      ...textBlock(item.subtitle, widthPt, {
        spaceBeforePt: item.title ? 0 : spaceBeforePt,
        spaceAfterPt: 0,
        keepWithNext: Boolean(
          item.dateRange || item.location || item.body || item.bullets.length > 0,
        ),
        sectionId: section.id,
        itemId: item.id,
      }),
    );
  }

  const meta = [item.dateRange, item.location].filter(Boolean).join('  ·  ');
  if (meta) {
    blocks.push(
      ...textBlock(meta, widthPt, {
        font: SMALL,
        color: COLORS.muted,
        lineHeightPt: TYPE.smallLinePt,
        spaceBeforePt: item.title || item.subtitle ? 1.5 : spaceBeforePt,
        spaceAfterPt: 2,
        keepWithNext: Boolean(item.body || item.bullets.length > 0),
        splittable: false,
        sectionId: section.id,
        itemId: item.id,
      }),
    );
  }

  if (item.body) {
    blocks.push(
      ...textBlock(item.body, widthPt, {
        spaceBeforePt: item.title || item.subtitle || meta ? 0 : spaceBeforePt,
        spaceAfterPt: SPACING.paragraphAfterPt,
        sectionId: section.id,
        itemId: item.id,
      }),
    );
  }

  for (const bullet of item.bullets) {
    blocks.push(...bulletBlocks(bullet, widthPt, section.id, item.id));
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

function buildColumnBlocks(resume: Resume, column: ColumnId): FlowBlock[] {
  const widthPt = column === 'main' ? COLUMNS.mainWidthPt : COLUMNS.sideWidthPt;
  const blocks: FlowBlock[] = [];
  let first = true;

  for (const section of resume.sections) {
    if (!section.enabled || section.column !== column || !hasContent(section)) continue;

    blocks.push(headingBlock(section, first));
    first = false;

    if (section.kind === 'summary' || section.kind === 'custom') {
      section.items.forEach((item, itemIndex) => {
        if (item.body) {
          blocks.push(
            ...textBlock(item.body, widthPt, {
              spaceBeforePt: itemIndex === 0 ? 0 : SPACING.itemBeforePt,
              spaceAfterPt: SPACING.paragraphAfterPt,
              sectionId: section.id,
              itemId: item.id,
            }),
          );
        }
        for (const bullet of item.bullets) {
          blocks.push(...bulletBlocks(bullet, widthPt, section.id, item.id));
        }
      });
      continue;
    }

    section.items.forEach((item, itemIndex) => {
      blocks.push(...itemBlocks(section, item, widthPt, itemIndex === 0));
    });
  }

  return blocks;
}

function translateBlock(block: PlacedBlock, xPt: number, yPt: number): PlacedBlock {
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
  const firstCapacityPt = PAGE.heightPt - MARGIN.topPt - HEADER.heightPt - MARGIN.bottomPt;
  const restCapacityPt = PAGE.heightPt - MARGIN.topPt - MARGIN.bottomPt;

  const mainBlocks = buildColumnBlocks(resume, 'main');
  const sideBlocks = buildColumnBlocks(resume, 'side');

  const mainPages = paginateColumn(
    mainBlocks,
    firstCapacityPt,
    restCapacityPt,
    COLUMNS.mainWidthPt,
  );
  const sidePages = paginateColumn(
    sideBlocks,
    firstCapacityPt,
    restCapacityPt,
    COLUMNS.sideWidthPt,
  );

  const pageCount = Math.max(1, mainPages.length, sidePages.length);
  const header = headerLayout(resume);
  const sideX = MARGIN.xPt + COLUMNS.mainWidthPt + COLUMNS.gapPt;

  const pages: PageLayout[] = Array.from({ length: pageCount }, (_, index) => {
    const top = MARGIN.topPt + (index === 0 ? HEADER.heightPt : 0);
    const blocks = [
      ...(mainPages[index] ?? []).map((block) => translateBlock(block, MARGIN.xPt, top)),
      ...(sidePages[index] ?? []).map((block) => translateBlock(block, sideX, top)),
    ];
    return {
      index,
      widthPt: PAGE.widthPt,
      heightPt: PAGE.heightPt,
      blocks,
      header: index === 0 ? header : undefined,
    };
  });

  return { pages, pageWidthPt: PAGE.widthPt, pageHeightPt: PAGE.heightPt };
}
