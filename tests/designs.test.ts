import { describe, expect, it } from 'vitest';
import {
  APPLICATION_CONTEXTS,
  COVER_LETTER_STYLES,
  RESUME_DESIGNS,
  resolveCoverLetterStyle,
  resolveResumeDesign,
  suggestedLetterStyle,
} from '../src/lib/designs';
import { normalizeTemplate } from '../src/lib/normalize';
import { DEFAULT_TEMPLATE, type ResumeLayoutId } from '../src/types/resume';

const ORIGINAL_LAYOUTS: ResumeLayoutId[] = ['twoColumn', 'atsSimple'];

describe('resume design registry', () => {
  it('ships ten designs with unique ids, names, and descriptions', () => {
    expect(RESUME_DESIGNS).toHaveLength(10);
    expect(new Set(RESUME_DESIGNS.map((design) => design.id)).size).toBe(10);
    expect(new Set(RESUME_DESIGNS.map((design) => design.name)).size).toBe(10);
    for (const design of RESUME_DESIGNS) {
      expect(design.description.length).toBeGreaterThan(10);
      expect(['helvetica', 'times']).toContain(design.fontFamily);
      expect([1, 2]).toContain(design.columns);
    }
  });

  it('keeps the two original designs with identity traits', () => {
    for (const id of ORIGINAL_LAYOUTS) {
      const design = resolveResumeDesign(id);
      expect(design.fontFamily).toBe('helvetica');
      expect(design.header).toMatchObject({
        align: 'left',
        nameScale: 1,
        nameLetterSpacingPt: 0,
        nameColor: 'accent',
        showRule: true,
        ruleWidthPt: 1.2,
        contactJoin: '  ·  ',
      });
      expect(design.heading).toMatchObject({
        transform: 'upper',
        scale: 1,
        letterSpacingPt: 0,
        color: 'accent',
        decor: 'none',
      });
      expect(design.body).toMatchObject({ scale: 1, lineScale: 1, bulletChar: '•' });
    }
    expect(resolveResumeDesign('twoColumn').columns).toBe(2);
    expect(resolveResumeDesign('twoColumn').arrangement).toBe('balanced');
    expect(resolveResumeDesign('twoColumn').header.variant).toBe('stacked');
    expect(resolveResumeDesign('twoColumn').item.layout).toBe('stacked');
    expect(resolveResumeDesign('atsSimple').columns).toBe(1);
    expect(resolveResumeDesign('atsSimple').arrangement).toBe('linear');
  });

  it('gives every design a distinct structural composition', () => {
    const signatures = new Set(
      RESUME_DESIGNS.map((design) =>
        [
          design.arrangement,
          design.header.variant,
          design.heading.decor,
          design.item.layout,
          design.sidebar.tint,
          design.fontFamily,
        ].join('|'),
      ),
    );
    expect(signatures.size).toBe(RESUME_DESIGNS.length);
  });

  it('uses genuinely different arrangements, headers, headings, and entry layouts', () => {
    expect(new Set(RESUME_DESIGNS.map((design) => design.arrangement)).size).toBeGreaterThanOrEqual(
      3,
    );
    expect(new Set(RESUME_DESIGNS.map((design) => design.header.variant)).size).toBeGreaterThanOrEqual(
      4,
    );
    expect(new Set(RESUME_DESIGNS.map((design) => design.heading.decor)).size).toBeGreaterThanOrEqual(
      5,
    );
    expect(new Set(RESUME_DESIGNS.map((design) => design.item.layout)).size).toBe(3);
  });

  it('keeps the original designs free of sidebar tint and structural decoration', () => {
    for (const id of ORIGINAL_LAYOUTS) {
      const design = resolveResumeDesign(id);
      expect(design.sidebar.tint).toBe('none');
      expect(design.sidebar.divider).toBe(false);
      expect(design.heading.decor).toBe('none');
      expect(design.item.layout).toBe('stacked');
    }
  });

  it('offers both single- and two-column designs and both font families', () => {
    expect(RESUME_DESIGNS.some((design) => design.columns === 1)).toBe(true);
    expect(RESUME_DESIGNS.some((design) => design.columns === 2)).toBe(true);
    expect(RESUME_DESIGNS.some((design) => design.fontFamily === 'times')).toBe(true);
    expect(RESUME_DESIGNS.some((design) => design.fontFamily === 'helvetica')).toBe(true);
  });

  it('recommends real designs for every application context', () => {
    expect(APPLICATION_CONTEXTS).toHaveLength(5);
    const ids = new Set(RESUME_DESIGNS.map((design) => design.id));
    for (const context of APPLICATION_CONTEXTS) {
      expect(context.recommended.length).toBeGreaterThan(0);
      for (const id of context.recommended) expect(ids.has(id)).toBe(true);
    }
    expect(APPLICATION_CONTEXTS.find((entry) => entry.id === 'government')?.recommended).toEqual([
      'classic',
      'atsSimple',
    ]);
    expect(APPLICATION_CONTEXTS.find((entry) => entry.id === 'experienced')?.recommended).toEqual([
      'compact',
    ]);
  });

  it('suggests a real cover letter style for every design', () => {
    const styles = new Set(COVER_LETTER_STYLES.map((style) => style.id));
    for (const design of RESUME_DESIGNS) {
      expect(styles.has(suggestedLetterStyle(design.id))).toBe(true);
    }
  });

  it('falls back to the defaults for unknown ids', () => {
    expect(resolveResumeDesign('unknown' as ResumeLayoutId).id).toBe('twoColumn');
    expect(resolveCoverLetterStyle('unknown' as never).id).toBe('classic');
  });

  it('ships four unique cover letter styles', () => {
    expect(COVER_LETTER_STYLES).toHaveLength(4);
    expect(new Set(COVER_LETTER_STYLES.map((style) => style.id)).size).toBe(4);
    expect(COVER_LETTER_STYLES.map((style) => style.id)).toEqual([
      'classic',
      'modern',
      'executive',
      'minimal',
    ]);
    const classic = resolveCoverLetterStyle('classic');
    expect(classic.header).toMatchObject({ align: 'left', showRule: true, ruleWidthPt: 1.2 });
    expect(classic.fontFamily).toBe('helvetica');
    expect(classic.subject.color).toBe('text');
    expect(classic.signature.bold).toBe(true);
  });
});

describe('template normalization', () => {
  it('normalizes a legacy template to the existing defaults', () => {
    expect(normalizeTemplate({})).toMatchObject({
      layout: 'twoColumn',
      letterStyle: 'classic',
      pagination: { keepEntriesTogether: true },
    });
  });

  it('keeps known designs, styles, and pagination settings', () => {
    expect(
      normalizeTemplate({
        layout: 'executive',
        letterStyle: 'minimal',
        pagination: { keepEntriesTogether: false },
      }),
    ).toMatchObject({
      layout: 'executive',
      letterStyle: 'minimal',
      pagination: { keepEntriesTogether: false },
    });
  });

  it('replaces unknown designs, styles, and invalid pagination values', () => {
    expect(
      normalizeTemplate({
        layout: 'not-a-design',
        letterStyle: 'not-a-style',
        pagination: { keepEntriesTogether: 'yes' },
      }),
    ).toMatchObject({
      layout: DEFAULT_TEMPLATE.layout,
      letterStyle: DEFAULT_TEMPLATE.letterStyle,
      pagination: { keepEntriesTogether: DEFAULT_TEMPLATE.pagination.keepEntriesTogether },
    });
  });
});
