import { describe, expect, it } from 'vitest';
import { docxTextContent, exportDocx } from '../src/lib/exportDocx';
import { layoutResume } from '../src/lib/layout';
import { createSampleResume } from '../src/lib/sample';

describe('DOCX export', () => {
  it('produces a non-empty Office Open XML package', async () => {
    const resume = createSampleResume();
    const layout = layoutResume(resume);
    const blob = await exportDocx(resume, layout);
    expect(blob.size).toBeGreaterThan(0);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
  });

  it('keeps every piece of resume text in the document source', () => {
    const resume = createSampleResume();
    const layout = layoutResume(resume);
    const text = docxTextContent(resume, layout).join(' ');
    expect(text).toContain('Jordan Avery');
    for (const section of resume.sections) {
      for (const item of section.items) {
        for (const bullet of item.bullets) {
          expect(text).toContain(bullet.replace(/\s+/g, ' '));
        }
      }
    }
  });
});
