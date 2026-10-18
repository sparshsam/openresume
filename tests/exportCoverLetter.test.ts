import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { collectCoverLetterContentStrings } from '../src/lib/content';
import { layoutCoverLetter } from '../src/lib/coverLetterLayout';
import { coverLetterMeta } from '../src/lib/documentMeta';
import { documentFilename } from '../src/lib/filename';
import {
  coverLetterDocxTextContent,
  createCoverLetterDocxDocument,
  exportCoverLetterDocx,
} from '../src/lib/exportDocx';
import { createPdfDocument } from '../src/lib/exportPdf';
import { parseCoverLetter } from '../src/lib/parseCoverLetter';
import { createSampleCoverLetter } from '../src/lib/coverLetterSample';
import type { CoverLetter } from '../src/types/coverLetter';
import type { PageSize } from '../src/types/resume';

const ASCII_LETTER = `# Parity Person
Product engineer | parity@example.com | +1 555 0100 | Toronto, ON

## DATE
October 18, 2026

## RECIPIENT
Morgan Lee
Hiring Manager
Example Labs
123 Example Street
Toronto, ON M5V 1A1

## POSITION
Senior Engineer

## SALUTATION
Dear Ms. Lee,

## BODY
First paragraph without special characters.

Second paragraph with a clear closing thought.

## CLOSING
Sincerely,

## SIGNATURE
Parity Person
`;

function withPageSize(letter: CoverLetter, pageSize: PageSize): CoverLetter {
  return { ...letter, template: { ...letter.template, pageSize } };
}

async function documentXml(letter: CoverLetter): Promise<string> {
  const layout = layoutCoverLetter(letter);
  const buffer = await Packer.toBuffer(createCoverLetterDocxDocument(letter, layout));
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('document.xml missing');
  return file.async('string');
}

function pageSize(xml: string): { width: number; height: number } {
  const tag = xml.match(/<w:pgSz[^>]*\/>/)?.[0];
  const width = tag?.match(/w:w="(\d+)"/)?.[1];
  const height = tag?.match(/w:h="(\d+)"/)?.[1];
  if (!width || !height) throw new Error('page size missing');
  return { width: Number(width), height: Number(height) };
}

describe('cover letter exports', () => {
  it('creates a selectable-text PDF with the expected page count', () => {
    const letter = createSampleCoverLetter();
    const layout = layoutCoverLetter(letter);
    const doc = createPdfDocument(coverLetterMeta(letter), layout);
    const output = doc.output();

    expect(output).toMatch(/^%PDF/);
    expect(doc.getNumberOfPages()).toBe(layout.pages.length);
    expect(output).not.toContain('/Subtype /Image');
    expect(output).toContain('Jordan Avery');
    expect(output).toContain('Senior Product Engineer');
    expect(output).toContain('Brightline Labs');
  });

  it('uses the selected PDF page size', () => {
    const cases: Array<[PageSize, number, number]> = [
      ['letter', 612, 792],
      ['a4', 595.28, 841.89],
      ['legal', 612, 1008],
    ];
    for (const [size, width, height] of cases) {
      const letter = withPageSize(createSampleCoverLetter(), size);
      const doc = createPdfDocument(coverLetterMeta(letter), layoutCoverLetter(letter));
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(width, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(height, 1);
    }
  });

  it('creates a single-column DOCX with the selected page size', async () => {
    const cases: Array<[PageSize, number, number]> = [
      ['letter', 12240, 15840],
      ['a4', 11906, 16838],
      ['legal', 12240, 20160],
    ];
    for (const [size, width, height] of cases) {
      const xml = await documentXml(withPageSize(createSampleCoverLetter(), size));
      expect(pageSize(xml), size).toEqual({ width, height });
      expect(xml).not.toContain('<w:tbl>');
    }
  });

  it('contains every content string in PDF and DOCX', async () => {
    const letter = parseCoverLetter(ASCII_LETTER).coverLetter;
    const layout = layoutCoverLetter(letter);
    const pdf = createPdfDocument(coverLetterMeta(letter), layout).output();
    const xml = await documentXml(letter);

    for (const value of collectCoverLetterContentStrings(letter)) {
      expect(pdf, `missing PDF text: ${value}`).toContain(value);
      expect(xml, `missing DOCX text: ${value}`).toContain(value);
    }
  });

  it('produces a valid DOCX package with editable text', async () => {
    const letter = createSampleCoverLetter();
    const blob = await exportCoverLetterDocx(letter, layoutCoverLetter(letter));
    expect(blob.size).toBeGreaterThan(0);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');

    const xml = await documentXml(letter);
    expect(xml).toContain('<w:t');
    expect(xml).not.toContain('<w:drawing');
  });

  it('keeps the DOCX text extraction helper aligned', () => {
    const letter = createSampleCoverLetter();
    const text = coverLetterDocxTextContent(letter, layoutCoverLetter(letter)).join(' ');
    for (const value of collectCoverLetterContentStrings(letter)) {
      expect(text).toContain(value);
    }
  });

  it('names cover letter files distinctly', () => {
    expect(documentFilename('Jordan Avery', 'coverLetter', 'pdf')).toBe(
      'Jordan-Avery-Cover-Letter.pdf',
    );
    expect(documentFilename('Jordan Avery', 'coverLetter', 'docx')).toBe(
      'Jordan-Avery-Cover-Letter.docx',
    );
  });
});
