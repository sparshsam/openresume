import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { collectContentStrings } from '../src/lib/content';
import { createDocxDocument, docxTextContent, exportDocx } from '../src/lib/exportDocx';
import { layoutResume } from '../src/lib/layout';
import { parseResume } from '../src/lib/parse';
import { createSampleResume } from '../src/lib/sample';
import type { PageSize, Resume } from '../src/types/resume';

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

function asciiResume(): Resume {
  return parseResume(ASCII_RESUME).resume;
}

function withPageSize(resume: Resume, pageSize: PageSize): Resume {
  return { ...resume, template: { ...resume.template, pageSize } };
}

async function documentXml(
  resume: Resume,
): Promise<{ xml: string; layout: ReturnType<typeof layoutResume> }> {
  const layout = layoutResume(resume);
  const buffer = await Packer.toBuffer(createDocxDocument(resume, layout));
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('document.xml missing');
  return { xml: await file.async('string'), layout };
}

function pageSize(xml: string): { width: number; height: number } {
  const tag = xml.match(/<w:pgSz[^>]*\/>/)?.[0];
  const width = tag?.match(/w:w="(\d+)"/)?.[1];
  const height = tag?.match(/w:h="(\d+)"/)?.[1];
  if (!width || !height) throw new Error('page size missing');
  return { width: Number(width), height: Number(height) };
}

describe('DOCX export', () => {
  it('produces a non-empty Office Open XML package', async () => {
    const resume = createSampleResume();
    const blob = await exportDocx(resume, layoutResume(resume));
    expect(blob.size).toBeGreaterThan(0);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
  });

  it('uses the selected page dimensions', async () => {
    const cases: Array<[PageSize, number, number]> = [
      ['letter', 12240, 15840],
      ['a4', 11906, 16838],
      ['legal', 12240, 20160],
    ];

    for (const [size, width, height] of cases) {
      const { xml } = await documentXml(withPageSize(createSampleResume(), size));
      expect(pageSize(xml), size).toEqual({ width, height });
    }
  });

  it('contains every content string', async () => {
    const resume = asciiResume();
    const { xml } = await documentXml(resume);
    for (const value of collectContentStrings(resume)) {
      expect(xml, `missing DOCX text: ${value}`).toContain(value);
    }
  });

  it('merges wrapped lines into readable paragraphs instead of one paragraph per line', async () => {
    const resume = createSampleResume();
    const { xml, layout } = await documentXml(resume);
    const paragraphCount = (xml.match(/<w:p[ >]/g) ?? []).length;
    const lineCount = layout.pages
      .flatMap((page) => page.blocks)
      .reduce((total, block) => total + block.lines.length, 0);

    expect(paragraphCount).toBeLessThan(lineCount);
    expect(xml).toContain('Led the rebuild of a document workflow used by 12,000 people');
  });

  it('uses real Word bullets and keeps headings with their content', async () => {
    const { xml } = await documentXml(asciiResume());
    expect(xml).toContain('<w:numPr>');
    expect(xml).toContain('Built a deterministic export pipeline for PDF and DOCX.');
    expect(xml).toContain('<w:keepNext/>');
    expect(xml).toContain('<w:keepLines/>');
  });

  it('keeps one logical table per layout page', async () => {
    const { xml, layout } = await documentXml(createSampleResume());
    const tables = (xml.match(/<w:tbl>/g) ?? []).length;
    expect(tables).toBe(layout.pages.length);
  });

  it('remains editable text with no embedded images', async () => {
    const { xml } = await documentXml(createSampleResume());
    expect(xml).toContain('<w:t');
    expect(xml).not.toContain('<w:drawing');
  });

  it('carries every bullet through a long document', async () => {
    const bullets = Array.from(
      { length: 90 },
      (_, index) => `Long document bullet ${index} with enough words to wrap naturally.`,
    );
    const { resume } = parseResume(
      [
        '# Long Person',
        'Long headline | long@example.com',
        '',
        '## EXPERIENCE',
        '### Company - Role',
        '2020 - Present | City',
        ...bullets.map((bullet) => `- ${bullet}`),
      ].join('\n'),
    );
    const { xml, layout } = await documentXml(resume);
    expect(layout.pages.length).toBeGreaterThan(1);
    for (const bullet of bullets) {
      expect(xml).toContain(bullet);
    }
  });

  it('keeps the text extraction helper aligned with the document model', () => {
    const resume = createSampleResume();
    const text = docxTextContent(resume, layoutResume(resume)).join(' ');
    for (const value of collectContentStrings(resume)) {
      expect(text).toContain(value);
    }
  });
});
