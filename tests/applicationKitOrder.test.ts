import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { layoutCoverLetter } from '../src/lib/coverLetterLayout';
import { createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { createApplicationKitDocxDocument, exportApplicationKitDocx } from '../src/lib/exportDocx';
import { createCombinedPdfDocument } from '../src/lib/exportPdf';
import { layoutResume } from '../src/lib/layout';
import { createSampleResume } from '../src/lib/sample';
import { DEFAULT_APPLICATION_KIT_ORDER } from '../src/types/applicationKit';
import type { ApplicationKitOrder } from '../src/types/applicationKit';
import type { PageSize, Resume } from '../src/types/resume';

const LETTER_MARKER = 'I am writing to apply';
const RESUME_MARKER = 'Led the rebuild of a document workflow';

function withPageSize(resume: Resume, pageSize: PageSize): Resume {
  return { ...resume, template: { ...resume.template, pageSize } };
}

async function combinedXml(resume: Resume, order: ApplicationKitOrder): Promise<string> {
  const letter = createSampleCoverLetter();
  const buffer = await Packer.toBuffer(
    createApplicationKitDocxDocument(
      resume,
      layoutResume(resume),
      letter,
      layoutCoverLetter(letter),
      order,
    ),
  );
  const zip = await JSZip.loadAsync(buffer);
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('document.xml missing');
  return file.async('string');
}

function combinedPdf(resume: Resume, order: ApplicationKitOrder) {
  const letter = createSampleCoverLetter();
  const letterLayout = layoutCoverLetter(letter);
  const resumeLayout = layoutResume(resume);
  return {
    doc: createCombinedPdfDocument('Jordan Avery', letterLayout, resumeLayout, order),
    letterLayout,
    resumeLayout,
  };
}

describe('application kit order', () => {
  it('defaults to the cover letter first', () => {
    expect(DEFAULT_APPLICATION_KIT_ORDER).toBe('coverLetterFirst');
  });
});

describe('combined PDF order', () => {
  it('keeps the cover letter first by default', () => {
    const { doc } = combinedPdf(createSampleResume(), DEFAULT_APPLICATION_KIT_ORDER);
    const output = doc.output();
    expect(output.indexOf(LETTER_MARKER)).toBeLessThan(output.indexOf(RESUME_MARKER));
  });

  it('puts the resume first when requested', () => {
    const { doc } = combinedPdf(createSampleResume(), 'resumeFirst');
    const output = doc.output();
    expect(output.indexOf(RESUME_MARKER)).toBeLessThan(output.indexOf(LETTER_MARKER));
  });

  it('preserves every page and each document page size in either order', () => {
    const resume = withPageSize(createSampleResume(), 'a4');

    for (const order of ['coverLetterFirst', 'resumeFirst'] as ApplicationKitOrder[]) {
      const { doc, letterLayout, resumeLayout } = combinedPdf(resume, order);
      expect(doc.getNumberOfPages()).toBe(letterLayout.pages.length + resumeLayout.pages.length);

      const firstLayout = order === 'resumeFirst' ? resumeLayout : letterLayout;
      const secondLayout = order === 'resumeFirst' ? letterLayout : resumeLayout;
      doc.setPage(1);
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(firstLayout.pageWidthPt, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(firstLayout.pageHeightPt, 1);
      doc.setPage(firstLayout.pages.length + 1);
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(secondLayout.pageWidthPt, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(secondLayout.pageHeightPt, 1);
    }
  });

  it('keeps selectable text and no images in either order', () => {
    for (const order of ['coverLetterFirst', 'resumeFirst'] as ApplicationKitOrder[]) {
      const output = combinedPdf(createSampleResume(), order).doc.output();
      expect(output).toContain(LETTER_MARKER);
      expect(output).toContain(RESUME_MARKER);
      expect(output).not.toContain('/Subtype /Image');
    }
  });

  it('records the order in the PDF subject', () => {
    expect(combinedPdf(createSampleResume(), 'resumeFirst').doc.output()).toContain(
      'Resume and Cover Letter',
    );
    expect(combinedPdf(createSampleResume(), 'coverLetterFirst').doc.output()).toContain(
      'Cover Letter and Resume',
    );
  });
});

describe('combined DOCX order', () => {
  it('keeps the cover letter first by default', async () => {
    const xml = await combinedXml(createSampleResume(), DEFAULT_APPLICATION_KIT_ORDER);
    expect(xml.indexOf(LETTER_MARKER)).toBeLessThan(xml.indexOf(RESUME_MARKER));
  });

  it('puts the resume first when requested', async () => {
    const xml = await combinedXml(createSampleResume(), 'resumeFirst');
    expect(xml.indexOf(RESUME_MARKER)).toBeLessThan(xml.indexOf(LETTER_MARKER));
  });

  it('inserts the explicit page break between the two documents in either order', async () => {
    const defaultOrder = await combinedXml(createSampleResume(), 'coverLetterFirst');
    const defaultBreak = defaultOrder.indexOf('<w:br w:type="page"/>');
    expect(defaultBreak).toBeGreaterThan(defaultOrder.indexOf(LETTER_MARKER));
    expect(defaultBreak).toBeLessThan(defaultOrder.indexOf(RESUME_MARKER));

    const reversed = await combinedXml(createSampleResume(), 'resumeFirst');
    const reversedBreak = reversed.indexOf('<w:br w:type="page"/>');
    expect(reversedBreak).toBeGreaterThan(reversed.indexOf(RESUME_MARKER));
    expect(reversedBreak).toBeLessThan(reversed.indexOf(LETTER_MARKER));
  });

  it('orders Word sections and their page sizes when geometry differs', async () => {
    const resume = withPageSize(createSampleResume(), 'a4');

    const reversed = await combinedXml(resume, 'resumeFirst');
    expect((reversed.match(/<w:sectPr/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(reversed).toContain('<w:type w:val="nextPage"/>');
    const firstPageSize = reversed.match(/<w:pgSz[^>]*>/)?.[0] ?? '';
    expect(firstPageSize).toContain('w:w="11906"');
    expect(reversed.indexOf('w:w="11906"')).toBeLessThan(reversed.indexOf('w:w="12240"'));

    const defaultOrder = await combinedXml(resume, 'coverLetterFirst');
    expect(defaultOrder.indexOf('w:w="12240"')).toBeLessThan(defaultOrder.indexOf('w:w="11906"'));
  });

  it("keeps each document's accent colour in either order", async () => {
    const sample = createSampleResume();
    const resume: Resume = {
      ...sample,
      template: { ...sample.template, accent: '#1D4ED8' },
    };

    for (const order of ['coverLetterFirst', 'resumeFirst'] as ApplicationKitOrder[]) {
      const xml = await combinedXml(resume, order);
      expect(xml).toContain('w:color w:val="1D4ED8"');
      expect(xml).toContain('w:color w:val="14532D"');
    }
  });
});

describe('combined DOCX with an ATS Simple resume', () => {
  it('stays table-free while keeping both documents and their order', async () => {
    const sample = createSampleResume();
    const ats: Resume = {
      ...sample,
      template: { ...sample.template, layout: 'atsSimple' },
    };

    const reversed = await combinedXml(ats, 'resumeFirst');
    expect(reversed).not.toContain('<w:tbl>');
    expect(reversed.indexOf(RESUME_MARKER)).toBeLessThan(reversed.indexOf(LETTER_MARKER));

    const defaultOrder = await combinedXml(ats, 'coverLetterFirst');
    expect(defaultOrder).not.toContain('<w:tbl>');
    expect(defaultOrder.indexOf(LETTER_MARKER)).toBeLessThan(defaultOrder.indexOf(RESUME_MARKER));
  });

  it('exports as a non-empty Office package in either order', async () => {
    const ats: Resume = {
      ...createSampleResume(),
      template: { ...createSampleResume().template, layout: 'atsSimple' },
    };
    const letter = createSampleCoverLetter();

    for (const order of ['coverLetterFirst', 'resumeFirst'] as ApplicationKitOrder[]) {
      const blob = await exportApplicationKitDocx(
        ats,
        layoutResume(ats),
        letter,
        layoutCoverLetter(letter),
        order,
      );
      const bytes = new Uint8Array(await blob.arrayBuffer());
      expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
    }
  });
});
