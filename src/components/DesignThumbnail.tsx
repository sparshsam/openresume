import type { CoverLetterStyle, ResumeDesign } from '../lib/designs';

const INK = '#1a1a1a';
const MUTED = '#9aa39a';
const LINE = '#d9ddd7';
const ACCENT_FALLBACK = '#14532d';

interface ResumeThumbnailProps {
  design: ResumeDesign;
}

function ResumeThumbnail({ design }: ResumeThumbnailProps) {
  const accent = ACCENT_FALLBACK;
  const nameFill = design.header.nameColor === 'accent' ? accent : INK;
  const headingFill = design.heading.color === 'accent' ? accent : INK;
  const fontFamily =
    design.fontFamily === 'times'
      ? "'Times New Roman', Times, serif"
      : 'Helvetica, Arial, sans-serif';
  const left = 12;
  const width = 96;
  const nameX = design.header.align === 'center' ? left + width / 2 : left;
  const nameAnchor = design.header.align === 'center' ? 'middle' : 'start';

  const sections = ['SUMMARY', 'EXPERIENCE', 'EDUCATION', 'SKILLS'];
  const mainX = left;
  const mainWidth = design.columns === 2 ? 58 : width;
  const sideX = left + 65;
  const sideWidth = 31;

  const renderSection = (
    title: string,
    x: number,
    sectionWidth: number,
    y: number,
    lines: number,
  ) => (
    <g key={`${title}-${x}`}>
      <text
        x={x}
        y={y}
        fontSize={3.2}
        fontWeight={700}
        fill={headingFill}
        fontFamily={fontFamily}
        letterSpacing={design.heading.letterSpacingPt > 0 ? 0.2 : 0}
      >
        {title}
      </text>
      {design.heading.decor !== 'none' ? (
        <rect
          x={x}
          y={y + 2}
          width={sectionWidth}
          height={Math.max(0.4, design.heading.decorThicknessPt)}
          fill={headingFill}
        />
      ) : null}
      {Array.from({ length: lines }, (_, index) => (
        <rect
          key={index}
          x={x}
          y={y + 5 + index * 3}
          width={sectionWidth * (index === lines - 1 ? 0.62 : 0.92)}
          height={1.5}
          rx={0.7}
          fill={LINE}
        />
      ))}
    </g>
  );

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
        fontSize={3.4}
        fill={MUTED}
        textAnchor={nameAnchor}
        fontFamily={fontFamily}
      >
        Product-minded software generalist
      </text>
      <text
        x={nameX}
        y={25.5}
        fontSize={3}
        fill={MUTED}
        textAnchor={nameAnchor}
        fontFamily={fontFamily}
      >
        jordan.avery@example.com · Toronto, ON
      </text>
      {design.header.showRule ? (
        <rect
          x={left}
          y={29}
          width={width}
          height={Math.max(0.7, design.header.ruleWidthPt / 2)}
          fill={
            design.header.ruleColor === 'accent'
              ? accent
              : design.header.ruleColor === 'text'
                ? INK
                : MUTED
          }
        />
      ) : null}

      {design.columns === 2 ? (
        <>
          {renderSection(sections[0], mainX, mainWidth, 38, 3)}
          {renderSection(sections[1], mainX, mainWidth, 54, 5)}
          {renderSection(sections[2], sideX, sideWidth, 38, 3)}
          {renderSection(sections[3], sideX, sideWidth, 54, 4)}
        </>
      ) : (
        <>
          {renderSection(sections[0], left, width, 38, 3)}
          {renderSection(sections[1], left, width, 54, 5)}
          {renderSection(sections[2], left, width, 76, 3)}
          {renderSection(sections[3], left, width, 92, 3)}
        </>
      )}
      <rect x={0.5} y={0.5} width={119} height={159} rx={4} fill="none" stroke={LINE} />
    </svg>
  );
}

interface LetterThumbnailProps {
  style: CoverLetterStyle;
}

function LetterThumbnail({ style }: LetterThumbnailProps) {
  const accent = ACCENT_FALLBACK;
  const nameFill = style.header.nameColor === 'accent' ? accent : INK;
  const fontFamily =
    style.fontFamily === 'times'
      ? "'Times New Roman', Times, serif"
      : 'Helvetica, Arial, sans-serif';
  const left = 14;
  const width = 92;
  const nameX = style.header.align === 'center' ? left + width / 2 : left;
  const nameAnchor = style.header.align === 'center' ? 'middle' : 'start';

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
