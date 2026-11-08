import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DesignThumbnail } from '../src/components/DesignThumbnail';
import { COVER_LETTER_STYLES, RESUME_DESIGNS, resolveResumeDesign } from '../src/lib/designs';

function renderResume(id: (typeof RESUME_DESIGNS)[number]['id']): SVGSVGElement {
  const { container } = render(
    <DesignThumbnail kind="resume" design={resolveResumeDesign(id)} />,
  );
  const svg = container.querySelector('svg.design-thumb');
  if (!svg) throw new Error(`missing thumbnail for ${id}`);
  return svg as SVGSVGElement;
}

describe('design thumbnails', () => {
  it('renders every resume design and letter style', () => {
    for (const design of RESUME_DESIGNS) {
      const svg = renderResume(design.id);
      expect(svg.getAttribute('viewBox')).toBe('0 0 120 160');
    }
    for (const style of COVER_LETTER_STYLES) {
      const { container } = render(<DesignThumbnail kind="coverLetter" style={style} />);
      expect(container.querySelector('svg.design-thumb')).toBeTruthy();
    }
  });

  it('draws a tinted rail only for sidebar designs', () => {
    for (const id of ['creative', 'compact', 'contemporary'] as const) {
      const svg = renderResume(id);
      const tints = [...svg.querySelectorAll('rect')].filter((rect) =>
        ['#e7efe8', '#f2f4f0'].includes(rect.getAttribute('fill') ?? ''),
      );
      expect(tints.length, id).toBeGreaterThan(0);
    }

    for (const id of ['twoColumn', 'atsSimple', 'executive', 'modernMinimal', 'classic', 'academic', 'bold'] as const) {
      const svg = renderResume(id);
      const tints = [...svg.querySelectorAll('rect')].filter((rect) =>
        ['#e7efe8', '#f2f4f0'].includes(rect.getAttribute('fill') ?? ''),
      );
      expect(tints.length, id).toBe(0);
    }
  });

  it('draws a filled banner for banner-header designs', () => {
    for (const id of ['bold', 'contemporary'] as const) {
      const svg = renderResume(id);
      const bands = [...svg.querySelectorAll('rect')].filter(
        (rect) =>
          rect.getAttribute('fill') === '#14532d' &&
          Number(rect.getAttribute('width')) >= 100 &&
          Number(rect.getAttribute('height')) >= 20,
      );
      expect(bands.length, id).toBeGreaterThan(0);
    }
  });

  it('draws heading decorations that match the registry', () => {
    const bold = renderResume('bold');
    const boldHeadingBands = [...bold.querySelectorAll('rect')].filter(
      (rect) => rect.getAttribute('fill') === '#14532d' && Number(rect.getAttribute('height')) === 6,
    );
    expect(boldHeadingBands.length).toBeGreaterThan(0);

    const modern = renderResume('modernMinimal');
    expect([...modern.querySelectorAll('rect')].some((rect) => rect.getAttribute('fill') === '#9aa39a')).toBe(
      true,
    );

    const academic = renderResume('academic');
    const gutterDates = [...academic.querySelectorAll('rect')].filter(
      (rect) => rect.getAttribute('fill') === '#9aa39a' && rect.getAttribute('width') === '11',
    );
    expect(gutterDates.length).toBeGreaterThan(0);
  });
});
