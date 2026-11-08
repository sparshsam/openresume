import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { collectContentStrings } from '../src/lib/content';
import { resumeMeta } from '../src/lib/documentMeta';
import { createDocxDocument, docxTextContent } from '../src/lib/exportDocx';
import { createPdfDocument } from '../src/lib/exportPdf';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import { tintAccent } from '../src/lib/layout';
import type { Resume, ResumeLayoutId } from '../src/types/resume';

const ASCII_RESUME = `# Parity Person
Product engineer | parity@example.com | +1 555 0100 | Toronto, ON | example.com/parity

## SUMMARY
A short summary line that is easy to extract.

## EXPERIENCE
### Example Company — Senior Engineer
2020 – Present | Toronto, ON
- Built a deterministic export pipeline.
- Kept every bullet across page boundaries.

## SKILLS
Languages: TypeScript, Python
`;

function asciiResume(): Resume {
  return parseResume(ASCII_RESUME).resume;
}

const DESIGN_IDS: ResumeLayoutId[] = [
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
];

function withLayout(resume: Resume, layoutId: ResumeLayoutId): Resume {
  return { ...resume, template: { ...resume.template, layout: layoutId } };
}

async function docxXml(resume: Resume): Promise<string> {
  const layout = layoutResume(resume);
  const buffer = await Packer.toBuffer(createDocxDocument(resume, layout));
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('document.xml missing');
  return file.async('string');
}

const ACCENT_TINT = tintAccent('#14532D', 0.08).replace('#', '').toUpperCase();

describe('new design exports', () => {
  it.each(DESIGN_IDS)('keeps selectable PDF text and no images for %s', (layoutId) => {
    const resume = withLayout(asciiResume(), layoutId);
    const layout = layoutResume(resume);
    const output = createPdfDocument(resumeMeta(resume), layout).output();

    expect(output).toMatch(/^%PDF/);
    expect(output).not.toContain('/Subtype /Image');
    for (const value of collectContentStrings(resume)) {
      // jsPDF encodes non-ASCII glyphs separately from the raw text stream.
      if (!/^[\x20-\x7E]+$/.test(value)) continue;
      expect(output, `missing PDF text: ${value}`).toContain(value);
    }
  });

  it.each(DESIGN_IDS)('keeps editable DOCX text for %s', async (layoutId) => {
    const resume = withLayout(createSampleResume(), layoutId);
    const layout = layoutResume(resume);
    const xml = await docxXml(resume);
    expect(xml).toContain('<w:t');

    expect(xml).toContain('<w:t');
    const extracted = docxTextContent(resume, layout).join(' ');
    for (const value of collectContentStrings(resume)) {
      expect(extracted, `missing DOCX text: ${value}`).toContain(value);
    }
  });

  it('keeps one body table per page for two-column designs', async () => {
    for (const layoutId of ['twoColumn', 'creative', 'compact', 'contemporary'] as const) {
      const resume = withLayout(createSampleResume(), layoutId);
      const layout = layoutResume(resume);
      const xml = await docxXml(resume);
      expect((xml.match(/<w:tbl>/g) ?? []).length, layoutId).toBe(layout.pages.length);
    }
  });

  it('emits no table for linear designs, including their tab-aligned headers', async () => {
    for (const layoutId of [
      'atsSimple',
      'executive',
      'modernMinimal',
      'classic',
      'academic',
      'bold',
    ] as const) {
      const xml = await docxXml(withLayout(createSampleResume(), layoutId));
      expect(xml, layoutId).not.toContain('<w:tbl>');
    }
  });

  it('uses right-tab metadata rows in Word', async () => {
    const xml = await docxXml(withLayout(createSampleResume(), 'executive'));
    expect(xml).toContain('<w:tabs>');
    expect(xml).toContain('<w:tab w:val="right"');
    expect(xml).toContain('<w:tab/>');
  });

  it('uses a left tab and hanging gutter in the academic design', async () => {
    const xml = await docxXml(withLayout(createSampleResume(), 'academic'));
    expect(xml).toContain('<w:tab w:val="left"');
    expect(xml).toContain('<w:tab/>');
  });

  it('shades filled headings and reverses their text', async () => {
    const xml = await docxXml(withLayout(createSampleResume(), 'bold'));
    expect(xml).toContain('w:fill="14532D"');
    expect(xml).toContain('w:color w:val="FFFFFF"');
  });

  it('shades the compact right rail and the contemporary accent rail', async () => {
    const compact = await docxXml(withLayout(createSampleResume(), 'compact'));
    expect(compact).toContain('w:fill="F3F5F2"');

    const contemporary = await docxXml(withLayout(createSampleResume(), 'contemporary'));
    expect(contemporary).toContain(`w:fill="${ACCENT_TINT}"`);
  });

  it('keeps the sidebar cells in visual order', async () => {
    const creative = await docxXml(withLayout(createSampleResume(), 'creative'));
    expect(creative.indexOf('SKILLS')).toBeGreaterThan(-1);
    expect(creative.indexOf('SUMMARY')).toBeGreaterThan(-1);
    // Left rail: the sidebar cell is emitted before the main cell.
    expect(creative.indexOf('SKILLS')).toBeLessThan(creative.indexOf('SUMMARY'));

    const contemporary = await docxXml(withLayout(createSampleResume(), 'contemporary'));
    // Right rail: the main cell is emitted before the sidebar cell.
    expect(contemporary.indexOf('SUMMARY')).toBeLessThan(contemporary.indexOf('SKILLS'));
  });
});
