import type { FontSpec } from './measure';

export type BlockKind =
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'meta'
  | 'body'
  | 'bullet'
  | 'listItem'
  | 'skillLabel'
  | 'skillValue'
  | 'letterDate'
  | 'recipient'
  | 'subject'
  | 'salutation'
  | 'letterBody'
  | 'closing'
  | 'signature';

export interface FlowLine {
  text: string;
  xOffsetPt: number;
  font: FontSpec;
  color: string;
  link?: string;
}

export interface FlowBlock {
  sectionId: string;
  itemId?: string;
  kind: BlockKind;
  lineHeightPt: number;
  lines: FlowLine[];
  spaceBeforePt: number;
  spaceAfterPt: number;
  splittable: boolean;
  keepWithNext?: boolean;
  /** Start this block on a fresh page when it is not already at the top. */
  forcePageBreak?: boolean;
  /** Height of the keep-together unit that starts at this block, when enabled. */
  groupHeightPt?: number;
  /** A rule drawn under the block's text, aligned with the column width. */
  headingRule?: { color: string; widthPt: number };
}

export interface PlacedLine extends FlowLine {
  xPt: number;
  yPt: number;
}

export interface PlacedRule {
  xPt: number;
  yPt: number;
  widthPt: number;
  thicknessPt: number;
  color: string;
}

export interface PlacedBlock {
  sectionId: string;
  itemId?: string;
  kind: BlockKind;
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
  lineHeightPt: number;
  lines: PlacedLine[];
  rule?: PlacedRule;
}

export interface PaginateOptions {
  keepEntriesTogether?: boolean;
}

export function blockHeight(block: FlowBlock): number {
  return block.spaceBeforePt + block.lines.length * block.lineHeightPt + block.spaceAfterPt;
}

export function paginateColumn(
  blocks: FlowBlock[],
  firstCapacityPt: number,
  restCapacityPt: number,
  columnWidthPt: number,
  options: PaginateOptions = {},
): PlacedBlock[][] {
  const pages: PlacedBlock[][] = [];
  let current: PlacedBlock[] = [];
  let usedPt = 0;
  let capacityPt = firstCapacityPt;

  const startPage = () => {
    pages.push(current);
    current = [];
    usedPt = 0;
    capacityPt = restCapacityPt;
  };

  const place = (block: FlowBlock, spaceBeforePt: number, spaceAfterPt: number) => {
    const yPt = usedPt + spaceBeforePt;
    const textBottomPt = yPt + block.lines.length * block.lineHeightPt;
    const placed: PlacedBlock = {
      sectionId: block.sectionId,
      itemId: block.itemId,
      kind: block.kind,
      xPt: 0,
      yPt,
      widthPt: columnWidthPt,
      heightPt: spaceBeforePt + block.lines.length * block.lineHeightPt + spaceAfterPt,
      lineHeightPt: block.lineHeightPt,
      lines: block.lines.map((line, index) => ({
        ...line,
        xPt: line.xOffsetPt,
        yPt: yPt + index * block.lineHeightPt,
      })),
      rule: block.headingRule
        ? {
            xPt: 0,
            yPt: textBottomPt + 1.5,
            widthPt: columnWidthPt,
            thicknessPt: block.headingRule.widthPt,
            color: block.headingRule.color,
          }
        : undefined,
    };
    current.push(placed);
    usedPt += placed.heightPt;
  };

  for (let index = 0; index < blocks.length; index += 1) {
    let block = blocks[index];
    let firstChunk = true;

    if (block.forcePageBreak && usedPt > 0) {
      startPage();
    }

    // A heading always stays with its first entry; whole entries stay together
    // when the document enables it. Both only apply when the unit fits a page.
    if (
      block.groupHeightPt &&
      usedPt > 0 &&
      (block.kind === 'heading' || options.keepEntriesTogether)
    ) {
      const availablePt = capacityPt - usedPt;
      if (block.groupHeightPt <= capacityPt && block.groupHeightPt > availablePt) {
        startPage();
      }
    }

    for (;;) {
      const spaceBeforePt = firstChunk ? block.spaceBeforePt : 0;
      const spaceAfterPt = block.spaceAfterPt;
      const neededPt = spaceBeforePt + block.lines.length * block.lineHeightPt + spaceAfterPt;
      const availablePt = capacityPt - usedPt;

      const next = blocks[index + 1];
      const keepWithNextPt =
        block.keepWithNext && next
          ? next.spaceBeforePt + Math.min(next.lines.length, 2) * next.lineHeightPt
          : 0;

      if (neededPt + keepWithNextPt <= availablePt) {
        place(block, spaceBeforePt, spaceAfterPt);
        break;
      }

      // Keep-with-next is the only reason this block does not fit: try a fresh page.
      if (keepWithNextPt > 0 && usedPt > 0 && neededPt <= capacityPt) {
        startPage();
        continue;
      }

      const linesThatFit = Math.floor(
        Math.max(0, availablePt - spaceBeforePt) / block.lineHeightPt,
      );

      if (block.splittable && linesThatFit >= 1 && linesThatFit < block.lines.length) {
        const chunk: FlowBlock = {
          ...block,
          lines: block.lines.slice(0, linesThatFit),
          spaceAfterPt: 0,
        };
        place(chunk, spaceBeforePt, 0);
        block = { ...block, lines: block.lines.slice(linesThatFit), spaceBeforePt: 0 };
        firstChunk = false;
        startPage();
        continue;
      }

      if (usedPt > 0) {
        startPage();
        continue;
      }

      // A block taller than a whole page: place it rather than loop forever.
      place(block, spaceBeforePt, neededPt <= availablePt ? spaceAfterPt : 0);
      break;
    }
  }

  pages.push(current);
  if (pages.length > 1 && pages[pages.length - 1].length === 0) pages.pop();
  return pages;
}
