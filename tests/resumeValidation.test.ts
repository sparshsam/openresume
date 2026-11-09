import { describe, expect, it } from 'vitest';
import { resumeHasContent } from '../src/lib/resumeValidation';
import { createSampleResume } from '../src/lib/sample';
import { DEFAULT_FORMAT, DEFAULT_TEMPLATE, type Resume } from '../src/types/resume';

function emptyResume(): Resume {
  return {
    schemaVersion: 1,
    header: { name: 'Jordan Avery' },
    contact: { links: [] },
    sections: [],
    template: { ...DEFAULT_TEMPLATE, format: { ...DEFAULT_FORMAT } },
  };
}

describe('resumeHasContent', () => {
  it('accepts a sample résumé', () => {
    expect(resumeHasContent(createSampleResume())).toBe(true);
  });

  it('rejects a résumé with no sections', () => {
    expect(resumeHasContent(emptyResume())).toBe(false);
  });

  it('rejects empty and disabled sections', () => {
    const resume = emptyResume();
    resume.sections = [
      {
        id: 'sec-0',
        kind: 'experience',
        title: 'EXPERIENCE',
        column: 'main',
        enabled: true,
        startOnNewPage: false,
        items: [{ id: 'item-0', bullets: [] }],
      },
      {
        id: 'sec-1',
        kind: 'summary',
        title: 'SUMMARY',
        column: 'main',
        enabled: false,
        startOnNewPage: false,
        items: [{ id: 'item-1', body: 'Disabled content.', bullets: [] }],
      },
    ];
    expect(resumeHasContent(resume)).toBe(false);
  });

  it('accepts a section with a title, body, metadata, or bullets', () => {
    const resume = emptyResume();
    resume.sections = [
      {
        id: 'sec-0',
        kind: 'experience',
        title: 'EXPERIENCE',
        column: 'main',
        enabled: true,
        startOnNewPage: false,
        items: [
          {
            id: 'item-0',
            title: 'Northwind Studio',
            dateRange: '2022 – Present',
            bullets: ['Led a rebuild.'],
          },
        ],
      },
    ];
    expect(resumeHasContent(resume)).toBe(true);
  });
});
