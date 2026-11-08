import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Packer } from 'docx';
import JSZip from 'jszip';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { layoutCoverLetter } from '../src/lib/coverLetterLayout';
import { COVER_LETTER_STYLES, resolveCoverLetterStyle } from '../src/lib/designs';
import { coverLetterMeta } from '../src/lib/documentMeta';
import { createCoverLetterDocxDocument } from '../src/lib/exportDocx';
import { createPdfDocument } from '../src/lib/exportPdf';
import { collectCoverLetterContentStrings } from '../src/lib/content';
import { SAMPLE_COVER_LETTER_TEXT, createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { SAMPLE_RESUME_TEXT } from '../src/lib/sample';
import type { CoverLetter } from '../src/types/coverLetter';
import type { CoverLetterStyleId } from '../src/types/resume';

function withStyle(letter: CoverLetter, letterStyle: CoverLetterStyleId): CoverLetter {
  return { ...letter, template: { ...letter.template, letterStyle } };
}

function layoutText(letter: CoverLetter): string {
  const layout = layoutCoverLetter(letter);
  const header = layout.pages[0]?.header;
  return [
    header?.name.text ?? '',
    ...(header?.headline ? [header.headline.text] : []),
    ...(header?.contactLines.map((line) => line.text) ?? []),
    ...layout.pages.flatMap((page) =>
      page.blocks.flatMap((block) => block.lines.map((line) => line.text)),
    ),
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('cover letter styles', () => {
  it.each(COVER_LETTER_STYLES.map((style) => style.id))(
    'preserves all letter content with the %s style',
    (styleId) => {
      const letter = withStyle(createSampleCoverLetter(), styleId);
      const text = layoutText(letter);
      for (const value of collectCoverLetterContentStrings(letter)) {
        expect(text).toContain(value.replace(/\s+/g, ' ').trim());
      }
      expect(layoutCoverLetter(letter).pages.length).toBeGreaterThan(0);
    },
  );

  it.each(COVER_LETTER_STYLES.map((style) => style.id))(
    'applies the %s style traits',
    (styleId) => {
      const letter = withStyle(createSampleCoverLetter(), styleId);
      const style = resolveCoverLetterStyle(styleId);
      const layout = layoutCoverLetter(letter);
      const header = layout.pages[0]?.header;
      const signature = layout.pages
        .flatMap((page) => page.blocks)
        .find((block) => block.kind === 'signature');
      const subject = layout.pages
        .flatMap((page) => page.blocks)
        .find((block) => block.kind === 'subject');

      expect(layout.headerAlign).toBe(style.header.align);
      expect(layout.fontFamily).toBe(style.fontFamily);
      expect(header?.name.font.family).toBe(style.fontFamily);
      expect(Boolean(header?.rule)).toBe(style.header.showRule);
      expect(Boolean(signature?.lines[0].font.bold)).toBe(style.signature.bold);
      expect(subject?.lines[0].color).toBe(
        style.subject.color === 'accent' ? letter.template.accent : '#1A1A1A',
      );
    },
  );

  it('gives the four styles distinct visual signatures', () => {
    const signatures = new Set(
      COVER_LETTER_STYLES.map((style) => {
        const layout = layoutCoverLetter(withStyle(createSampleCoverLetter(), style.id));
        return [
          style.fontFamily,
          style.header.align,
          style.header.showRule,
          style.header.nameScale,
          style.body.lineScale,
          style.subject.color,
          style.signature.bold,
          layout.pages[0]?.header?.name.font.sizePt.toFixed(2),
        ].join('|');
      }),
    );
    expect(signatures.size).toBe(4);
  });

  it.each(COVER_LETTER_STYLES.map((style) => style.id))(
    'exports selectable PDF text with the %s style',
    (styleId) => {
      const letter = withStyle(createSampleCoverLetter(), styleId);
      const output = createPdfDocument(coverLetterMeta(letter), layoutCoverLetter(letter)).output();
      expect(output).toMatch(/^%PDF/);
      expect(output).toContain('Jordan Avery');
      expect(output).toContain('I am writing to apply');
      expect(output).not.toContain('/Subtype /Image');
    },
  );

  it('maps the executive style to serif centered DOCX output', async () => {
    const letter = withStyle(createSampleCoverLetter(), 'executive');
    const layout = layoutCoverLetter(letter);
    const buffer = await Packer.toBuffer(createCoverLetterDocxDocument(letter, layout));
    const zip = await JSZip.loadAsync(buffer);
    const xml = (await zip.file('word/document.xml')?.async('string')) ?? '';

    expect(xml).toContain('Times New Roman');
    expect(xml).toContain('w:jc w:val="center"');
    expect(xml).toContain('I am writing to apply');
  });
});

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

async function buildResume(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Build Resume' }));
  fireEvent.change(screen.getByLabelText('Resume text'), {
    target: { value: SAMPLE_RESUME_TEXT },
  });
  await user.click(screen.getByRole('button', { name: 'Build Resume' }));
}

async function buildCoverLetter(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByRole('button', { name: 'Build Cover Letter' })[0]);
  fireEvent.change(screen.getByLabelText('Cover letter text'), {
    target: { value: SAMPLE_COVER_LETTER_TEXT },
  });
  await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));
}

describe('coordinated cover letter suggestion', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    localStorage.clear();
  });

  it('suggests a coordinated letter style without changing it', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));
    await user.click(screen.getByRole('radio', { name: /Executive\./ }));

    await user.click(
      screen.getByRole('button', { name: /OpenResume home|Back to document selection/ }),
    );
    await buildCoverLetter(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));

    expect(screen.getByText(/Executive pairs well with Executive Letter/)).toBeInTheDocument();
    const letterGallery = screen.getByRole('radiogroup', { name: 'Letter style' });
    expect(within(letterGallery).getByRole('radio', { name: /Classic Letter\./ })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Use Executive Letter' }));

    expect(within(letterGallery).getByRole('radio', { name: /Executive Letter\./ })).toBeChecked();
    expect(screen.queryByText(/pairs well with/)).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Resume preview')).getAllByText(/I am writing to apply/).length,
    ).toBeGreaterThan(0);
  });
});
