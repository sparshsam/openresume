import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { collectContentStrings } from '../src/lib/content';
import { resolveResumeDesign } from '../src/lib/designs';
import { createDocxDocument } from '../src/lib/exportDocx';
import { createPdfDocument } from '../src/lib/exportPdf';
import { resumeMeta } from '../src/lib/documentMeta';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { Resume, ResumeLayoutId } from '../src/types/resume';

const ASCII_RESUME = `# Parity Person
Product engineer | parity@example.com | +1 555 0100 | Toronto, ON | example.com/parity

## SUMMARY
A short summary line that is easy to extract.

## EXPERIENCE
### Example Company - Senior Engineer
2020 - Present | Toronto, ON
- Built a deterministic export pipeline for PDF and DOCX.
- Kept every bullet across page boundaries.

## SKILLS
Languages: TypeScript, Python
`;

function withLayout(resume: Resume, layout: ResumeLayoutId): Resume {
  return { ...resume, template: { ...resume.template, layout } };
}

function layoutText(resume: Resume): string {
  const layout = layoutResume(resume);
  const header = layout.pages[0]?.header;
  const headerLines = header
    ? [
        header.name.text,
        ...(header.headline ? [header.headline.text] : []),
        ...header.contactLines.map((line) => line.text),
      ]
    : [];
  const blockLines = layout.pages.flatMap((page) =>
    page.blocks.flatMap((block) =>
      block.lines.map((line, index) =>
        block.kind === 'bullet' && index === 0 ? line.text.replace(/^[•–]\s+/, '') : line.text,
      ),
    ),
  );
  return [...headerLines, ...blockLines].join(' ').replace(/\s+/g, ' ').trim();
}

function normalized(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

const DESIGN_IDS = [
  'twoColumn',
  'atsSimple',
  'executive',
  'modernMinimal',
  'classic',
  'creative',
  'compact',
  'academic',
  'contemporary',
  'bold',
] as ResumeLayoutId[];

describe('resume template switching', () => {
  it.each(DESIGN_IDS)('preserves every content value under %s', (layoutId) => {
    const resume = withLayout(createSampleResume(), layoutId);
    const layout = layoutResume(resume);
    const text = layoutText(resume);

    expect(layout.variant).toBe(layoutId);
    for (const value of collectContentStrings(resume)) {
      expect(text).toContain(normalized(value));
    }
    expect(layout.pages.length).toBeGreaterThan(0);
  });

  it.each(DESIGN_IDS)('honours the %s design structure', (layoutId) => {
    const design = resolveResumeDesign(layoutId);
    const layout = layoutResume(withLayout(createSampleResume(), layoutId));

    expect(layout.columns).toBe(design.columns);
    expect(layout.fontFamily).toBe(design.fontFamily);
    expect(layout.headerAlign).toBe(design.header.align);

    const header = layout.pages[0]?.header;
    expect(Boolean(header?.rule)).toBe(design.header.showRule);
    expect(header?.name.font.family).toBe(design.fontFamily);
    expect(header?.name.font.letterSpacingPt).toBe(design.header.nameLetterSpacingPt);

    const headingBlocks = layout.pages
      .flatMap((page) => page.blocks)
      .filter((block) => block.kind === 'heading');
    expect(headingBlocks.length).toBeGreaterThan(0);
    for (const heading of headingBlocks) {
      expect(heading.lines[0].font.family).toBe(design.fontFamily);
      const decorated = Boolean(heading.band) || (heading.rules?.length ?? 0) > 0;
      expect(decorated).toBe(design.heading.decor !== 'none');
    }
  });

  it('gives all ten designs a distinct visual signature', () => {
    const signatures = new Set(
      DESIGN_IDS.map((layoutId) => {
        const design = resolveResumeDesign(layoutId);
        const layout = layoutResume(withLayout(createSampleResume(), layoutId));
        const header = layout.pages[0]?.header;
        return [
          design.fontFamily,
          design.columns,
          design.header.align,
          design.header.showRule,
          design.header.ruleWidthPt,
          header?.name.font.sizePt.toFixed(2),
          design.heading.letterSpacingPt,
          design.heading.decor,
          design.heading.scale,
          design.body.scale,
          design.body.lineScale,
        ].join('|');
      }),
    );
    expect(signatures.size).toBe(10);
  });

  it('keeps stored column assignments when switching between column counts', () => {
    const resume = createSampleResume();
    const storedColumns = resume.sections.map((section) => `${section.id}:${section.column}`);
    const sideSections = resume.sections.filter((section) => section.column === 'side');

    const single = layoutResume(withLayout(resume, 'executive'));
    const singleSectionIds = new Set(
      single.pages.flatMap((page) => page.blocks.map((block) => block.sectionId)),
    );
    for (const section of sideSections) {
      expect(singleSectionIds.has(section.id)).toBe(true);
    }
    expect(layoutResume(withLayout(resume, 'executive')).pages[0].header?.name.text).toBe(
      'Jordan Avery',
    );
    expect(resume.sections.map((section) => `${section.id}:${section.column}`)).toEqual(
      storedColumns,
    );

    const backToTwoColumns = layoutResume(withLayout(resume, 'twoColumn'));
    expect(backToTwoColumns.columns).toBe(2);
    expect(resume.sections.map((section) => `${section.id}:${section.column}`)).toEqual(
      storedColumns,
    );
  });

  it('switching designs never changes the underlying document model', () => {
    const resume = createSampleResume();
    const before = JSON.stringify({ ...resume, template: undefined });
    for (const layoutId of DESIGN_IDS) layoutResume(withLayout(resume, layoutId));
    expect(JSON.stringify({ ...resume, template: undefined })).toBe(before);
    expect(resume.template.layout).toBe('twoColumn');
  });

  it.each(DESIGN_IDS)('keeps pages inside the document bounds for %s', (layoutId) => {
    const layout = layoutResume(withLayout(createSampleResume(), layoutId));
    layout.pages.forEach((page, index) => {
      expect(page.index).toBe(index);
      expect(page.blocks.length + (page.header ? 1 : 0)).toBeGreaterThan(0);
      for (const block of page.blocks) {
        expect(block.xPt).toBeGreaterThanOrEqual(0);
        expect(block.xPt + block.widthPt).toBeLessThanOrEqual(page.widthPt + 0.01);
        expect(block.yPt).toBeGreaterThanOrEqual(0);
        if (block.lines.length > 0) {
          const lastLine = block.lines[block.lines.length - 1];
          expect(lastLine.yPt + block.lineHeightPt).toBeLessThanOrEqual(page.heightPt + 0.6);
        }
      }
    });
  });

  it.each(DESIGN_IDS)('exports selectable PDF text for %s', (layoutId) => {
    const resume = withLayout(parseResume(ASCII_RESUME).resume, layoutId);
    const layout = layoutResume(resume);
    const output = createPdfDocument(resumeMeta(resume), layout).output();

    expect(output).toMatch(/^%PDF/);
    expect(output).toContain('Parity Person');
    expect(output).toContain('Built a deterministic export pipeline');
    expect(output).not.toContain('/Subtype /Image');
    expect(layout.pages.length).toBeGreaterThan(0);
  });

  it.each([
    ['twoColumn', true],
    ['executive', false],
    ['creative', true],
    ['atsSimple', false],
  ] as [ResumeLayoutId, boolean][])(
    'exports %s DOCX with the expected structure',
    async (layoutId, expectTable) => {
      const resume = withLayout(parseResume(ASCII_RESUME).resume, layoutId);
      const layout = layoutResume(resume);
      const buffer = await Packer.toBuffer(createDocxDocument(resume, layout));
      const zip = await JSZip.loadAsync(buffer);
      const xml = await zip.file('word/document.xml')?.async('string');
      expect(xml).toBeTruthy();
      const document = xml ?? '';

      expect(document).toContain('Parity Person');
      expect(document).toContain('Built a deterministic export pipeline');
      expect(document.includes('<w:tbl>')).toBe(expectTable);
      if (layoutId === 'executive') {
        expect(document).toContain('Times New Roman');
      } else {
        expect(document).toContain('Helvetica');
      }
    },
  );
});
