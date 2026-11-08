import type { CoverLetterStyle, ResumeDesign } from '../lib/designs';

const INK = '#1a1a1a';
const MUTED = '#9aa39a';
const LINE = '#d9ddd7';
const ACCENT_FALLBACK = '#14532d';
const BAND_TEXT = '#ffffff';
const SIDEBAR_MUTED = '#f2f4f0';
const SIDEBAR_ACCENT = '#e7efe8';

const PAGE_LEFT = 8;
const PAGE_RIGHT = 112;
const PAGE_BOTTOM = 152;

function serifOrSans(family: ResumeDesign['fontFamily'] | CoverLetterStyle['fontFamily']): string {
  return family === 'times' ? "'Times New Roman', Times, serif" : 'Helvetica, Arial, sans-serif';
}

function headingDecor(
  decor: ResumeDesign['heading']['decor'],
  accent: string,
  x: number,
  y: number,
  width: number,
  thickness: number,
) {
  switch (decor) {
    case 'underline':
      return (
        <rect x={x} y={y + 3} width={width} height={Math.max(0.35, thickness)} fill={accent} />
      );
    case 'trailing':
      return (
        <rect
          x={x + width * 0.38}
          y={y + 3}
          width={width * 0.62}
          height={Math.max(0.3, thickness)}
          fill={MUTED}
        />
      );
    case 'bar':
      return <rect x={x} y={y - 2.2} width={1.4} height={4.4} fill={accent} />;
    case 'topRule':
      return (
        <rect x={x} y={y - 2.8} width={width} height={Math.max(0.6, thickness)} fill={accent} />
      );
    case 'boxed':
      return (
        <>
          <rect x={x} y={y - 2.6} width={width} height={Math.max(0.3, thickness)} fill={accent} />
          <rect x={x} y={y + 3} width={width} height={Math.max(0.3, thickness)} fill={accent} />
        </>
      );
    case 'fill':
      return <rect x={x - 1.5} y={y - 2.8} width={width + 3} height={6} fill={accent} />;
    case 'none':
    default:
      return null;
  }
}

interface ColumnSpec {
  x: number;
  width: number;
  sections: { title: string; lines: number }[];
}

function Section({
  design,
  accent,
  x,
  y,
  width,
  title,
  lines,
}: ColumnSpec['sections'][number] & {
  design: ResumeDesign;
  accent: string;
  x: number;
  y: number;
  width: number;
}) {
  const headingColor =
    design.heading.decor === 'fill' ? BAND_TEXT : design.heading.color === 'accent' ? accent : INK;
  const inset = design.heading.decor === 'bar' ? 4 : design.heading.decor === 'fill' ? 1.5 : 0;
  return (
    <g>
      <text
        x={x + inset}
        y={y + 2}
        fontSize={2.7}
        fontWeight={700}
        fill={headingColor}
        fontFamily={serifOrSans(design.fontFamily)}
        letterSpacing={design.heading.letterSpacingPt > 1 ? 0.15 : 0}
      >
        {title}
      </text>
      {headingDecor(design.heading.decor, accent, x, y, width, design.heading.decorThicknessPt)}
      {Array.from({ length: lines }, (_, index) => {
        const rowY = y + 7 + index * 3.1;
        if (design.item.layout === 'titleRow' && index % 2 === 0) {
          return (
            <g key={index}>
              <rect
                x={x}
                y={rowY}
                width={width * 0.5}
                height={1.4}
                rx={0.3}
                fill={INK}
                opacity={0.72}
              />
              <rect
                x={x + width * 0.62}
                y={rowY}
                width={width * 0.38}
                height={1.2}
                rx={0.3}
                fill={MUTED}
              />
            </g>
          );
        }
        if (design.item.layout === 'gutter' && index % 3 === 0) {
          return (
            <g key={index}>
              <rect x={x} y={rowY} width={11} height={1.2} rx={0.3} fill={MUTED} />
              <rect
                x={x + 15}
                y={rowY}
                width={width - 15}
                height={1.4}
                rx={0.3}
                fill={INK}
                opacity={0.72}
              />
            </g>
          );
        }
        return (
          <rect
            key={index}
            x={x + (design.item.layout === 'gutter' ? 15 : 0)}
            y={rowY}
            width={
              (width - (design.item.layout === 'gutter' ? 15 : 0)) *
              (index === lines - 1 ? 0.62 : 0.94)
            }
            height={1.3}
            rx={0.3}
            fill={LINE}
          />
        );
      })}
    </g>
  );
}

function ResumeThumbnail({ design }: { design: ResumeDesign }) {
  const accent = ACCENT_FALLBACK;
  const fontFamily = serifOrSans(design.fontFamily);
  const nameFill = design.header.nameColor === 'accent' ? accent : INK;
  const centered = design.header.variant === 'centered' || design.header.align === 'center';
  const nameX = centered ? 60 : PAGE_LEFT;
  const nameAnchor = centered ? 'middle' : 'start';
  const contactAnchor = centered ? 'middle' : 'end';

  let headerBottom: number;
  const header = (
    <>
      {design.header.variant === 'banner' ? (
        <rect
          x={6}
          y={6}
          width={108}
          height={design.heading.decor === 'fill' ? 25 : 23}
          rx={1}
          fill={accent}
        />
      ) : null}
      <text
        x={design.header.variant === 'banner' ? 11 : nameX}
        y={design.header.variant === 'banner' ? 16 : 16}
        fontSize={design.header.variant === 'banner' ? 10 : 8}
        fontWeight={700}
        fill={design.header.variant === 'banner' ? BAND_TEXT : nameFill}
        textAnchor={design.header.variant === 'banner' ? 'start' : nameAnchor}
        fontFamily={fontFamily}
        letterSpacing={design.header.nameLetterSpacingPt > 0.8 ? 0.3 : 0}
      >
        Jordan Avery
      </text>
      {design.header.variant === 'banner' ? (
        <>
          <text x={11} y={21.5} fontSize={3.3} fill={BAND_TEXT} fontFamily={fontFamily}>
            Product-minded software generalist
          </text>
          <text x={PAGE_LEFT} y={35} fontSize={2.9} fill={MUTED} fontFamily={fontFamily}>
            jordan.avery@example.com · Toronto, ON
          </text>
        </>
      ) : design.header.variant === 'split' || design.header.variant === 'compact' ? (
        <>
          <text
            x={nameX}
            y={21}
            fontSize={3.2}
            fill={MUTED}
            textAnchor={nameAnchor}
            fontFamily={fontFamily}
          >
            Product-minded software generalist
          </text>
          <text
            x={PAGE_RIGHT}
            y={14}
            fontSize={2.7}
            fill={MUTED}
            textAnchor={contactAnchor}
            fontFamily={fontFamily}
          >
            jordan.avery@example.com
          </text>
          <text
            x={PAGE_RIGHT}
            y={17.2}
            fontSize={2.7}
            fill={MUTED}
            textAnchor={contactAnchor}
            fontFamily={fontFamily}
          >
            +1 555 0142 · Toronto, ON
          </text>
          <text
            x={PAGE_RIGHT}
            y={20.4}
            fontSize={2.7}
            fill={MUTED}
            textAnchor={contactAnchor}
            fontFamily={fontFamily}
          >
            linkedin.com/in/jordanavery
          </text>
        </>
      ) : (
        <>
          <text
            x={nameX}
            y={21}
            fontSize={3.3}
            fill={MUTED}
            textAnchor={nameAnchor}
            fontFamily={fontFamily}
          >
            Product-minded software generalist
          </text>
          <text
            x={nameX}
            y={25}
            fontSize={2.8}
            fill={MUTED}
            textAnchor={nameAnchor}
            fontFamily={fontFamily}
          >
            jordan.avery@example.com · Toronto, ON
          </text>
        </>
      )}
      {design.header.showRule && design.header.variant !== 'banner' ? (
        <rect
          x={PAGE_LEFT}
          y={design.header.variant === 'split' || design.header.variant === 'compact' ? 25 : 28}
          width={PAGE_RIGHT - PAGE_LEFT}
          height={Math.max(0.7, design.header.ruleWidthPt)}
          fill={
            design.header.ruleColor === 'accent'
              ? accent
              : design.header.ruleColor === 'text'
                ? INK
                : MUTED
          }
        />
      ) : null}
      {design.header.doubleRule && design.header.showRule ? (
        <rect
          x={PAGE_LEFT}
          y={
            (design.header.variant === 'split' || design.header.variant === 'compact' ? 25 : 28) +
            1.6
          }
          width={PAGE_RIGHT - PAGE_LEFT}
          height={0.35}
          fill={
            design.header.ruleColor === 'accent'
              ? accent
              : design.header.ruleColor === 'text'
                ? INK
                : MUTED
          }
        />
      ) : null}
    </>
  );

  if (design.header.variant === 'banner') headerBottom = 41;
  else if (design.header.variant === 'split' || design.header.variant === 'compact')
    headerBottom = 30;
  else headerBottom = 32;

  const bodyTop = headerBottom + 4;
  const sections: { title: string; lines: number }[] = [
    { title: 'SUMMARY', lines: 3 },
    { title: 'EXPERIENCE', lines: 6 },
    { title: 'EDUCATION', lines: 3 },
    { title: 'SKILLS', lines: 3 },
  ];

  const sidebarTint =
    design.sidebar.tint === 'muted'
      ? SIDEBAR_MUTED
      : design.sidebar.tint === 'accentSoft'
        ? SIDEBAR_ACCENT
        : undefined;

  let columns: ColumnSpec[];
  let sidebarRect: { x: number; width: number } | undefined;
  let dividerX: number | undefined;

  if (design.arrangement === 'sidebarLeft') {
    sidebarRect = { x: 6, width: 34 };
    dividerX = 41;
    columns = [
      { x: 46, width: PAGE_RIGHT - 46, sections: [sections[0], sections[1], sections[2]] },
      { x: 10, width: 25, sections: [sections[3]] },
    ];
  } else if (design.arrangement === 'sidebarRight') {
    sidebarRect = { x: PAGE_RIGHT - 32, width: 32 };
    dividerX = PAGE_RIGHT - 34;
    columns = [
      { x: PAGE_LEFT, width: 66, sections: [sections[0], sections[1], sections[2]] },
      { x: PAGE_RIGHT - 28, width: 22, sections: [sections[3]] },
    ];
  } else if (design.arrangement === 'balanced') {
    if (sidebarTint) sidebarRect = { x: 76, width: PAGE_RIGHT - 76 + 2 };
    if (design.sidebar.divider) dividerX = 78;
    columns = [
      { x: PAGE_LEFT, width: 66, sections: [sections[0], sections[1]] },
      { x: 80, width: 32, sections: [sections[2], sections[3]] },
    ];
  } else {
    columns = [
      {
        x: PAGE_LEFT,
        width: PAGE_RIGHT - PAGE_LEFT,
        sections:
          design.item.layout === 'gutter'
            ? [sections[0], sections[1], sections[2], sections[3]]
            : sections,
      },
    ];
  }

  return (
    <svg
      className="design-thumb"
      viewBox="0 0 120 160"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x={0} y={0} width={120} height={160} rx={4} fill="#ffffff" />
      {sidebarRect && sidebarTint ? (
        <rect
          x={sidebarRect.x}
          y={bodyTop - 2}
          width={sidebarRect.width}
          height={PAGE_BOTTOM - bodyTop + 2}
          fill={sidebarTint}
        />
      ) : null}
      {dividerX !== undefined && design.sidebar.divider ? (
        <rect
          x={dividerX}
          y={bodyTop - 2}
          width={0.5}
          height={PAGE_BOTTOM - bodyTop + 2}
          fill={LINE}
        />
      ) : null}
      {header}
      {columns.map((column, columnIndex) =>
        columnIndex === 0 ? (
          <g key={columnIndex}>
            {column.sections.map((section, sectionIndex) => {
              const y = bodyTop + sectionIndex * 26;
              return (
                <Section
                  key={section.title}
                  design={design}
                  accent={accent}
                  x={column.x}
                  y={y}
                  width={column.width}
                  title={section.title}
                  lines={section.lines}
                />
              );
            })}
          </g>
        ) : (
          <g key={columnIndex}>
            {column.sections.map((section, sectionIndex) => {
              const y = bodyTop + 2 + sectionIndex * 20;
              return (
                <Section
                  key={section.title}
                  design={design}
                  accent={accent}
                  x={column.x}
                  y={y}
                  width={column.width}
                  title={section.title}
                  lines={Math.min(section.lines, 4)}
                />
              );
            })}
          </g>
        ),
      )}
      <rect x={0.5} y={0.5} width={119} height={159} rx={4} fill="none" stroke={LINE} />
    </svg>
  );
}

function LetterThumbnail({ style }: { style: CoverLetterStyle }) {
  const accent = ACCENT_FALLBACK;
  const nameFill = style.header.nameColor === 'accent' ? accent : INK;
  const fontFamily = serifOrSans(style.fontFamily);
  const centered = style.header.variant === 'centered' || style.header.align === 'center';
  const left = 14;
  const width = 92;
  const nameX = centered ? left + width / 2 : left;
  const nameAnchor = centered ? 'middle' : 'start';

  return (
    <svg
      className="design-thumb"
      viewBox="0 0 120 160"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect x={0} y={0} width={120} height={160} rx={4} fill="#ffffff" />
      <text
        x={nameX}
        y={16}
        fontSize={8}
        fontWeight={700}
        fill={nameFill}
        textAnchor={nameAnchor}
        fontFamily={fontFamily}
      >
        Jordan Avery
      </text>
      <text
        x={nameX}
        y={21}
        fontSize={3.2}
        fill={MUTED}
        textAnchor={nameAnchor}
        fontFamily={fontFamily}
      >
        jordan.avery@example.com · Toronto, ON
      </text>
      {style.header.showRule ? (
        <rect x={left} y={25} width={width} height={0.8} fill={accent} />
      ) : null}
      <rect x={left} y={32} width={26} height={1.6} rx={0.8} fill={LINE} />
      <rect x={left} y={38} width={34} height={1.6} rx={0.8} fill={LINE} />
      <rect x={left} y={41} width={30} height={1.6} rx={0.8} fill={LINE} />
      <rect
        x={left}
        y={48}
        width={44}
        height={2}
        rx={1}
        fill={style.subject.color === 'accent' ? accent : INK}
      />
      {[0, 1, 2].map((paragraph) => (
        <g key={paragraph}>
          {[0, 1, 2, 3].map((line) => (
            <rect
              key={line}
              x={left}
              y={58 + paragraph * 18 + line * 3.4}
              width={width * (line === 3 ? 0.55 : 0.94)}
              height={1.5}
              rx={0.7}
              fill={LINE}
            />
          ))}
        </g>
      ))}
      <rect x={left} y={122} width={24} height={1.6} rx={0.8} fill={LINE} />
      <rect
        x={left}
        y={131}
        width={32}
        height={2}
        rx={1}
        fill={style.signature.bold ? INK : LINE}
      />
      <rect x={0.5} y={0.5} width={119} height={159} rx={4} fill="none" stroke={LINE} />
    </svg>
  );
}

export function DesignThumbnail(
  props:
    { kind: 'resume'; design: ResumeDesign } | { kind: 'coverLetter'; style: CoverLetterStyle },
) {
  return props.kind === 'resume' ? (
    <ResumeThumbnail design={props.design} />
  ) : (
    <LetterThumbnail style={props.style} />
  );
}
