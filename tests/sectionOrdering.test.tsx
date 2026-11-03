import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { createPdfDocument } from '../src/lib/exportPdf';
import { resumeMeta } from '../src/lib/documentMeta';
import { layoutResume } from '../src/lib/layout';
import { reorderSection } from '../src/lib/resumeEdits';
import { SAMPLE_RESUME_TEXT, createSampleResume } from '../src/lib/sample';
import type { Resume } from '../src/types/resume';

function articleOrder(resume: Resume): string[] {
  return resume.sections.map((section) => section.title);
}

describe('reorderSection', () => {
  it('places the dragged section immediately before the drop target', () => {
    const resume = createSampleResume();
    const before = articleOrder(resume);
    const [first, second] = resume.sections;

    const reordered = reorderSection(resume, first.id, resume.sections[2].id);
    expect(articleOrder(reordered)).toEqual([
      second.title,
      before[0],
      before[2],
      ...before.slice(3),
    ]);

    const backToTop = reorderSection(reordered, resume.sections[2].id, first.id);
    expect(articleOrder(backToTop).slice(0, 3)).toEqual([before[1], before[2], before[0]]);
  });

  it('is a no-op for unknown or identical ids', () => {
    const resume = createSampleResume();
    expect(reorderSection(resume, 'missing', resume.sections[0].id)).toBe(resume);
    expect(reorderSection(resume, resume.sections[0].id, resume.sections[0].id)).toBe(resume);
  });

  it('never reassigns a section to another column', () => {
    const resume = createSampleResume();
    const columns = new Map(resume.sections.map((section) => [section.id, section.column]));
    const reordered = reorderSection(
      resume,
      resume.sections[0].id,
      resume.sections[resume.sections.length - 1].id,
    );
    for (const section of reordered.sections) {
      expect(section.column).toBe(columns.get(section.id));
    }
  });
});

describe('section ordering surface', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    localStorage.clear();
  });

  async function buildSampleResume(user: ReturnType<typeof userEvent.setup>) {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));
    fireEvent.change(screen.getByLabelText('Resume text'), {
      target: { value: SAMPLE_RESUME_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));
  }

  it('still supports the up and down buttons', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);

    const sections = () =>
      Array.from(document.querySelectorAll('.section-card')).map((card) =>
        card.getAttribute('aria-label'),
      );
    const first = sections()[0];

    await user.click(screen.getByRole('button', { name: `Move ${first} down` }));
    expect(sections()[1]).toBe(first);

    await user.click(screen.getByRole('button', { name: `Move ${first} up` }));
    expect(sections()[0]).toBe(first);
  });

  it('reorders sections with accessible drag and drop', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);

    const cards = Array.from(document.querySelectorAll<HTMLElement>('.section-card'));
    const before = cards.map((card) => card.getAttribute('aria-label'));
    const handles = screen.getAllByRole('button', { name: /^Drag to reorder / });
    const sourceId = cards[0].id.replace('section-', '');

    const dataTransfer = {
      data: new Map<string, string>(),
      effectAllowed: 'move',
      dropEffect: 'move',
      setData(type: string, value: string) {
        this.data.set(type, value);
      },
      getData(type: string) {
        return this.data.get(type) ?? '';
      },
    };

    fireEvent.dragStart(handles[0], { dataTransfer });
    fireEvent.dragOver(cards[2], { dataTransfer });
    fireEvent.drop(cards[2], { dataTransfer });

    const after = Array.from(document.querySelectorAll('.section-card')).map((card) =>
      card.getAttribute('aria-label'),
    );
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    expect(sourceId).toBeTruthy();

    const preview = screen.getByLabelText('Resume preview');
    const previewText = Array.from(preview.querySelectorAll('.page-line'))
      .map((line) => line.textContent)
      .join(' ');
    expect(previewText).toContain(before[0] ?? '');
  });

  it('keeps editor, preview, and PDF heading order aligned', () => {
    const resume = createSampleResume();
    const reordered = reorderSection(
      resume,
      resume.sections[resume.sections.length - 1].id,
      resume.sections[0].id,
    );
    const singleColumn: Resume = {
      ...reordered,
      template: { ...reordered.template, layout: 'atsSimple' },
    };
    const layout = layoutResume(singleColumn);
    const headings = layout.pages
      .flatMap((page) => page.blocks)
      .filter((block) => block.kind === 'heading')
      .map((block) => block.lines[0].text);
    const expected = singleColumn.sections
      .filter((section) => section.enabled && section.items.length > 0)
      .map((section) => section.title.toUpperCase());
    expect(headings).toEqual(expected);

    const pdf = createPdfDocument(resumeMeta(singleColumn), layout).output();
    let previous = -1;
    for (const heading of headings) {
      const index = pdf.indexOf(heading);
      expect(index).toBeGreaterThan(previous);
      previous = index;
    }
  });

  it('does not rewrite content when reordering', () => {
    const resume = createSampleResume();
    const reordered = reorderSection(
      resume,
      resume.sections[0].id,
      resume.sections[resume.sections.length - 1].id,
    );
    expect(JSON.stringify({ ...reordered, sections: [] })).toBe(
      JSON.stringify({ ...resume, sections: [] }),
    );
    expect(reordered.sections.reduce((sum, section) => sum + section.items.length, 0)).toBe(
      resume.sections.reduce((sum, section) => sum + section.items.length, 0),
    );
  });
});
