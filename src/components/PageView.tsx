import type { CSSProperties } from 'react';
import type { PlacedLine } from '../lib/paginate';
import type { HeaderLine, PageLayout } from '../lib/layout';
import type { FontSpec } from '../lib/measure';

interface PageViewProps {
  page: PageLayout;
  onFocusTarget?: (sectionId: string, itemId?: string) => void;
}

function textStyle(
  xPt: number,
  yPt: number,
  font: FontSpec,
  color: string,
  lineHeightPt: number,
): CSSProperties {
  return {
    left: `${xPt}pt`,
    top: `${yPt}pt`,
    fontSize: `${font.sizePt}pt`,
    fontWeight: font.bold ? 700 : 400,
    fontStyle: font.italic ? 'italic' : 'normal',
    color,
    lineHeight: `${lineHeightPt}pt`,
  };
}

function placedStyle(line: PlacedLine, lineHeightPt: number): CSSProperties {
  return textStyle(line.xPt, line.yPt, line.font, line.color, lineHeightPt);
}

function headerStyle(line: HeaderLine, lineHeightPt: number): CSSProperties {
  return textStyle(line.xPt, line.yPt, line.font, line.color, lineHeightPt);
}

export function PageView({ page, onFocusTarget }: PageViewProps) {
  return (
    <div
      className="page"
      style={{ width: `${page.widthPt}pt`, height: `${page.heightPt}pt` }}
      role="group"
      aria-label={`Resume page ${page.index + 1}`}
    >
      {page.header ? (
        <>
          <span
            className="page-line"
            style={headerStyle(page.header.name, page.header.name.font.sizePt * 1.17)}
            onClick={() => onFocusTarget?.('__header__')}
          >
            {page.header.name.text}
          </span>
          {page.header.headline ? (
            <span
              className="page-line"
              style={headerStyle(page.header.headline, page.header.headline.font.sizePt * 1.24)}
              onClick={() => onFocusTarget?.('__header__')}
            >
              {page.header.headline.text}
            </span>
          ) : null}
          {page.header.contactLines.map((line, index) => (
            <span
              key={`contact-${index}`}
              className="page-line"
              style={headerStyle(line, line.font.sizePt * 1.33)}
              onClick={() => onFocusTarget?.('__header__')}
            >
              {line.text}
            </span>
          ))}
          <span
            className="page-rule"
            style={{
              left: `${page.header.rule.x1Pt}pt`,
              top: `${page.header.rule.y1Pt}pt`,
              width: `${page.header.rule.x2Pt - page.header.rule.x1Pt}pt`,
              height: `${page.header.rule.widthPt}pt`,
              background: page.header.rule.color,
            }}
          />
        </>
      ) : null}

      {page.blocks.map((block, blockIndex) =>
        block.lines.map((line, lineIndex) => (
          <span
            key={`${block.sectionId}-${block.itemId ?? 'section'}-${blockIndex}-${lineIndex}`}
            className="page-line"
            style={placedStyle(line, block.lineHeightPt)}
            onClick={() => onFocusTarget?.(block.sectionId, block.itemId)}
          >
            {line.text}
          </span>
        )),
      )}

      <span className="page-label">Page {page.index + 1}</span>
    </div>
  );
}
