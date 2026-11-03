import type { CSSProperties } from 'react';
import type { PlacedLine } from '../lib/paginate';
import type { HeaderLine, PageLayout } from '../lib/layout';
import type { FontSpec } from '../lib/measure';

interface PageViewProps {
  page: PageLayout;
  onFocusTarget?: (sectionId: string, itemId?: string) => void;
}

const SERIF_STACK = "'Times New Roman', Times, 'Liberation Serif', serif";
const SANS_STACK = "Helvetica, Arial, 'Liberation Sans', sans-serif";

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
    fontFamily: font.family === 'times' ? SERIF_STACK : SANS_STACK,
    letterSpacing: `${font.letterSpacingPt ?? 0}pt`,
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
              style={headerStyle(line, line.font.sizePt * 1.38)}
              onClick={() => onFocusTarget?.('__header__')}
            >
              {line.text}
            </span>
          ))}
          {page.header.rule ? (
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
          ) : null}
        </>
      ) : null}

      {page.blocks.map((block, blockIndex) => (
        <span key={`block-${block.sectionId}-${block.itemId ?? 'section'}-${blockIndex}`}>
          {block.rule ? (
            <span
              className="page-rule"
              style={{
                left: `${block.rule.xPt}pt`,
                top: `${block.rule.yPt}pt`,
                width: `${block.rule.widthPt}pt`,
                height: `${block.rule.thicknessPt}pt`,
                background: block.rule.color,
              }}
            />
          ) : null}
          {block.lines.map((line, lineIndex) => (
            <span
              key={`${block.sectionId}-${block.itemId ?? 'section'}-${blockIndex}-${lineIndex}`}
              className="page-line"
              style={placedStyle(line, block.lineHeightPt)}
              onClick={() => onFocusTarget?.(block.sectionId, block.itemId)}
            >
              {line.text}
            </span>
          ))}
        </span>
      ))}

      <span className="page-label">Page {page.index + 1}</span>
    </div>
  );
}
