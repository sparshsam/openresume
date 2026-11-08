import type { FontSpec } from './measure';

export type BlockKind =
  | 'heading'
  | 'title'
  | 'titleRow'
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
  /** Vertical offset from the block's text top. Defaults to line index × line height. */
  yOffsetPt?: number;
}

export interface FlowRect {
  xOffsetPt: number;
  yOffsetPt: number;
  widthPt: number;
  heightPt: number;
  color: string;
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
  /** Used instead of `lines.length × lineHeight` for multi-line single-row blocks. */
  heightOverridePt?: number;
  /** Left indent applied by DOCX; preview and PDF read the line offsets directly. */
  indentLeftPt?: number;
  /** Marks a title-and-metadata row so DOCX can lay it out with tab stops. */
  rowLayout?: 'metaRight' | 'metaLeft';
  /** Heading decoration consumed by DOCX paragraph borders and shading. */
  decorKind?: string;
  /** Horizontal alignment of the block's text. */
  alignment?: 'left' | 'center';
  /** Rectangles drawn relative to the block start. */
  rules?: FlowRect[];
  /** A filled rectangle drawn behind the block. */
  band?: FlowRect;
}

export interface PlacedLine extends FlowLine {
  xPt: number;
  yPt: number;
}

export interface PlacedRect {
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
  color: string;
}

export type PlacedRule = PlacedRect;
export type PlacedBand = PlacedRect;

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
  rules?: PlacedRule[];
  band?: PlacedBand;
  rowLayout?: 'metaRight' | 'metaLeft';
  decorKind?: string;
  alignment?: 'left' | 'center';
  indentLeftPt?: number;
}

export interface PaginateOptions {
  keepEntriesTogether?: boolean;
}

function textHeight(block: FlowBlock): number {
  return block.heightOverridePt ?? block.lines.length * block.lineHeightPt;
}

function placeRect(rect: FlowRect, xPt: number, yPt: number): PlacedRect {
  return {
    xPt: xPt + rect.xOffsetPt,
    yPt: yPt + rect.yOffsetPt,
    widthPt: rect.widthPt,
    heightPt: rect.heightPt,
    color: rect.color,
  };
}

export function blockHeight(block: FlowBlock): number {
  return block.spaceBeforePt + textHeight(block) + block.spaceAfterPt;
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
    const heightPt = textHeight(block);
    const rules: PlacedRule[] = (block.rules ?? []).map((rect) => placeRect(rect, 0, yPt));
    const placed: PlacedBlock = {
      sectionId: block.sectionId,
      itemId: block.itemId,
      kind: block.kind,
      xPt: 0,
      yPt,
      widthPt: columnWidthPt,
      heightPt: spaceBeforePt + heightPt + spaceAfterPt,
      lineHeightPt: block.lineHeightPt,
      lines: block.lines.map((line, index) => ({
        ...line,
        xPt: line.xOffsetPt,
        yPt: yPt + (line.yOffsetPt ?? index * block.lineHeightPt),
      })),
      rule: rules[0],
      rules: rules.length > 0 ? rules : undefined,
      band: block.band ? placeRect(block.band, 0, yPt) : undefined,
      rowLayout: block.rowLayout,
      decorKind: block.decorKind,
      alignment: block.alignment,
      indentLeftPt: block.indentLeftPt,
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
      const neededPt = spaceBeforePt + textHeight(block) + spaceAfterPt;
      const availablePt = capacityPt - usedPt;

      const next = blocks[index + 1];
      const keepWithNextPt =
        block.keepWithNext && next
          ? next.spaceBeforePt + Math.min(textHeight(next), 2 * next.lineHeightPt)
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

      if (
        block.splittable &&
        !block.heightOverridePt &&
        linesThatFit >= 1 &&
        linesThatFit < block.lines.length
      ) {
        const chunk: FlowBlock = {
          ...block,
          lines: block.lines.slice(0, linesThatFit),
          spaceAfterPt: 0,
          rules: block.rules,
          band: block.band,
        };
        place(chunk, spaceBeforePt, 0);
        block = {
          ...block,
          lines: block.lines.slice(linesThatFit),
          spaceBeforePt: 0,
          rules: undefined,
          band: undefined,
          rowLayout: undefined,
          indentLeftPt: block.indentLeftPt,
        };
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
