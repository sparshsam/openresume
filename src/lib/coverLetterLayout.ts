import {
  buildDocumentHeader,
  textBlock,
  translatePlacedBlock,
  type Layout,
  type PageLayout,
} from './layout';
import { resolveMetrics, type ResolvedMetrics } from './metrics';
import { paginateColumn, type FlowBlock } from './paginate';
import { COLORS } from './tokens';
import type { CoverLetter } from '../types/coverLetter';
import type { FontSpec } from './measure';

function bodyFont(metrics: ResolvedMetrics): FontSpec {
  return { sizePt: metrics.bodyPt };
}

function boldFont(metrics: ResolvedMetrics): FontSpec {
  return { sizePt: metrics.bodyPt, bold: true };
}

function letterBlock(
  text: string,
  metrics: ResolvedMetrics,
  options: {
    kind: FlowBlock['kind'];
    sectionId: string;
    itemId?: string;
    font: FontSpec;
    spaceBeforePt: number;
    spaceAfterPt: number;
    keepWithNext?: boolean;
    splittable?: boolean;
  },
): FlowBlock {
  return textBlock(text, metrics.contentWidthPt, {
    kind: options.kind,
    sectionId: options.sectionId,
    itemId: options.itemId,
    font: options.font,
    color: COLORS.text,
    lineHeightPt: metrics.bodyLinePt,
    spaceBeforePt: options.spaceBeforePt,
    spaceAfterPt: options.spaceAfterPt,
    keepWithNext: options.keepWithNext,
    splittable: options.splittable,
  });
}

export function layoutCoverLetter(letter: CoverLetter): Layout {
  const metrics = resolveMetrics(letter.template);
  const accent = letter.template.accent || COLORS.accent;
  const { header, heightPt: headerHeightPt } = buildDocumentHeader(
    {
      name: letter.applicant.name,
      headline: letter.applicant.headline,
      contact: letter.applicant.contact,
    },
    metrics,
    accent,
  );

  const blocks: FlowBlock[] = [];
  const body = bodyFont(metrics);
  const bold = boldFont(metrics);

  if (letter.date) {
    blocks.push(
      letterBlock(letter.date, metrics, {
        kind: 'letterDate',
        sectionId: 'letter-date',
        font: body,
        spaceBeforePt: 18,
        spaceAfterPt: 16,
        splittable: false,
      }),
    );
  }

  const recipientLines = letter.recipient.map((line) => line.trim()).filter(Boolean);
  recipientLines.forEach((line, index) => {
    const isLast = index === recipientLines.length - 1;
    blocks.push(
      letterBlock(line, metrics, {
        kind: 'recipient',
        sectionId: 'letter-recipient',
        font: body,
        spaceBeforePt: 0,
        spaceAfterPt: isLast ? 16 : 0,
        keepWithNext: !isLast,
        splittable: false,
      }),
    );
  });

  if (letter.position) {
    blocks.push(
      letterBlock(letter.position, metrics, {
        kind: 'subject',
        sectionId: 'letter-position',
        font: bold,
        spaceBeforePt: 0,
        spaceAfterPt: 14,
        keepWithNext: Boolean(letter.salutation || letter.body.length > 0),
        splittable: false,
      }),
    );
  }

  if (letter.salutation) {
    blocks.push(
      letterBlock(letter.salutation, metrics, {
        kind: 'salutation',
        sectionId: 'letter-salutation',
        font: body,
        spaceBeforePt: 0,
        spaceAfterPt: 12,
        keepWithNext: letter.body.length > 0,
        splittable: false,
      }),
    );
  }

  const paragraphs = letter.body
    .map((text, index) => ({ text, index }))
    .filter((paragraph) => paragraph.text.trim().length > 0);
  const hasClosing = Boolean(letter.closing || letter.signature);
  paragraphs.forEach((paragraph, index) => {
    const isLast = index === paragraphs.length - 1;
    blocks.push(
      letterBlock(paragraph.text, metrics, {
        kind: 'letterBody',
        sectionId: 'letter-body',
        itemId: String(paragraph.index),
        font: body,
        spaceBeforePt: 0,
        spaceAfterPt: isLast && hasClosing ? 0 : metrics.paragraphSpacingPt,
        splittable: true,
      }),
    );
  });

  if (letter.closing) {
    blocks.push(
      letterBlock(letter.closing, metrics, {
        kind: 'closing',
        sectionId: 'letter-closing',
        font: body,
        spaceBeforePt: 14,
        spaceAfterPt: 0,
        keepWithNext: Boolean(letter.signature),
        splittable: false,
      }),
    );
  }

  if (letter.signature) {
    blocks.push(
      letterBlock(letter.signature, metrics, {
        kind: 'signature',
        sectionId: 'letter-signature',
        font: bold,
        spaceBeforePt: letter.closing ? 22 : 26,
        spaceAfterPt: 0,
        splittable: false,
      }),
    );
  }

  const firstCapacityPt =
    metrics.pageHeightPt - metrics.marginTopPt - headerHeightPt - metrics.marginBottomPt;
  const restCapacityPt = metrics.pageHeightPt - metrics.marginTopPt - metrics.marginBottomPt;

  const columnPages = paginateColumn(
    blocks,
    firstCapacityPt,
    restCapacityPt,
    metrics.contentWidthPt,
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

  return {
    kind: 'coverLetter',
    variant: 'letter',
    pages: finalPages,
    pageWidthPt: metrics.pageWidthPt,
    pageHeightPt: metrics.pageHeightPt,
    pageSizeLabel: metrics.pageSizeLabel,
    metrics,
    accent,
  };
}
