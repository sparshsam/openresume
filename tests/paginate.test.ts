import { describe, expect, it } from 'vitest';
import { paginateColumn, type FlowBlock } from '../src/lib/paginate';

function block(lines: string[], options: Partial<FlowBlock> = {}): FlowBlock {
  return {
    sectionId: 'sec-0',
    lineHeightPt: 10,
    lines: lines.map((text) => ({
      text,
      xOffsetPt: 0,
      font: { sizePt: 10 },
      color: '#000',
    })),
    spaceBeforePt: 0,
    spaceAfterPt: 0,
    splittable: true,
    ...options,
  };
}

describe('paginateColumn', () => {
  it('keeps blocks together when they fit', () => {
    const pages = paginateColumn([block(['a']), block(['b'])], 100, 100, 200);
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(2);
  });

  it('moves an atomic block to the next page instead of splitting it', () => {
    const pages = paginateColumn(
      [block(['a', 'b', 'c', 'd', 'e']), block(['x'], { splittable: false })],
      50,
      50,
      200,
    );
    expect(pages).toHaveLength(2);
    expect(pages[0]).toHaveLength(1);
    expect(pages[1][0].lines[0].text).toBe('x');
  });

  it('splits a long splittable block at line boundaries without losing lines', () => {
    const lines = Array.from({ length: 25 }, (_, index) => `line ${index}`);
    const pages = paginateColumn([block(lines)], 100, 100, 200);
    expect(pages.length).toBeGreaterThan(1);
    const rendered = pages.flatMap((page) => page.flatMap((item) => item.lines.map((l) => l.text)));
    expect(rendered).toEqual(lines);
  });

  it('honours keepWithNext by moving a heading to the next page', () => {
    const pages = paginateColumn(
      [
        block(['filler1', 'filler2', 'filler3', 'filler4']),
        block(['heading'], { keepWithNext: true, splittable: false }),
        block(['content', 'content2'], { splittable: false }),
      ],
      50,
      50,
      200,
    );
    expect(pages).toHaveLength(2);
    expect(pages[1][0].lines[0].text).toBe('heading');
    expect(pages[1][1].lines[0].text).toBe('content');
  });

  it('never returns a trailing empty page', () => {
    const pages = paginateColumn([block(['a', 'b', 'c', 'd', 'e'])], 50, 50, 200);
    expect(pages[pages.length - 1].length).toBeGreaterThan(0);
  });

  it('places a block taller than a page rather than looping forever', () => {
    const lines = Array.from({ length: 40 }, (_, index) => `line ${index}`);
    const pages = paginateColumn([block(lines, { splittable: false })], 50, 50, 200);
    expect(pages).toHaveLength(1);
    expect(pages[0][0].lines).toHaveLength(40);
  });
});
