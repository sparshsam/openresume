import type { CSSProperties } from 'react';
import type { PlacedLine, PlacedRect } from '../lib/paginate';
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

function rectStyle(
  rect: PlacedRect,
  className: string,
): { className: string; style: CSSProperties } {
  return {
    className,
    style: {
      left: `${rect.xPt}pt`,
      top: `${rect.yPt}pt`,
      width: `${rect.widthPt}pt`,
      height: `${rect.heightPt}pt`,
      background: rect.color,
    },
  };
}

export function PageView({ page, onFocusTarget }: PageViewProps) {
  return (
    <div
      className="page"
      style={{ width: `${page.widthPt}pt`, height: `${page.heightPt}pt` }}
      role="group"
      aria-label={`Resume page ${page.index + 1}`}
    >
      {(page.backgrounds ?? []).map((rect, index) => {
        const { className, style } = rectStyle(rect, 'page-background');
        return <span key={`background-${index}`} className={className} style={style} />;
      })}

      {page.header ? (
        <>
          {page.header.band ? (
            <span {...rectStyle(page.header.band, 'page-band')} aria-hidden="true" />
          ) : null}
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
          {[page.header.rule, page.header.secondRule].map((rule, index) =>
            rule ? (
              <span
                key={`header-rule-${index}`}
                className="page-rule"
                style={{
                  left: `${rule.x1Pt}pt`,
                  top: `${rule.y1Pt}pt`,
                  width: `${rule.x2Pt - rule.x1Pt}pt`,
                  height: `${rule.widthPt}pt`,
                  background: rule.color,
                }}
              />
            ) : null,
          )}
        </>
      ) : null}

      {page.divider ? (
        <span {...rectStyle(page.divider, 'page-divider')} aria-hidden="true" />
      ) : null}

      {page.blocks.map((block, blockIndex) => (
        <span key={`block-${block.sectionId}-${block.itemId ?? 'section'}-${blockIndex}`}>
          {block.band ? <span {...rectStyle(block.band, 'page-band')} aria-hidden="true" /> : null}
          {(block.rules ?? (block.rule ? [block.rule] : [])).map((rule, ruleIndex) => (
            <span
              key={`rule-${ruleIndex}`}
              className="page-rule"
              style={{
                left: `${rule.xPt}pt`,
                top: `${rule.yPt}pt`,
                width: `${rule.widthPt}pt`,
                height: `${rule.heightPt}pt`,
                background: rule.color,
              }}
            />
          ))}
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
