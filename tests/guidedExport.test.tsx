import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { SAMPLE_RESUME_TEXT } from '../src/lib/sample';

const mocks = vi.hoisted(() => ({
  savePdf: vi.fn(),
  downloadBlob: vi.fn(),
  exportDocx: vi.fn(async () => new Blob(['docx'], { type: 'application/octet-stream' })),
  exportCoverLetterDocx: vi.fn(
    async () => new Blob(['docx'], { type: 'application/octet-stream' }),
  ),
}));

vi.mock('../src/lib/exportPdf', () => ({
  createPdfDocument: () => ({ save: mocks.savePdf }),
  exportPdf: vi.fn(),
  createCombinedPdfDocument: vi.fn(),
  exportCombinedPdf: vi.fn(),
}));

vi.mock('../src/lib/exportDocx', () => ({
  exportDocx: mocks.exportDocx,
  exportCoverLetterDocx: mocks.exportCoverLetterDocx,
}));

vi.mock('../src/lib/download', () => ({
  downloadBlob: mocks.downloadBlob,
}));

type User = ReturnType<typeof userEvent.setup>;

function renderGuided() {
  window.history.replaceState(
    {},
    '',
    `/prepare?${new URLSearchParams({
      job_title: 'Senior Product Engineer',
      employer: 'Brightline Labs',
      jd_url: 'https://jobs.example.com/42',
      apply_url: 'https://jobs.example.com/apply/42',
    }).toString()}`,
  );
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

async function toReview(user: User) {
  await user.click(screen.getByRole('radio', { name: 'ChatGPT' }));
  await user.click(screen.getByRole('checkbox', { name: /I have opened my AI assistant/ }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.change(screen.getByLabelText('AI-generated content'), {
    target: { value: SAMPLE_RESUME_TEXT },
  });
  await user.click(screen.getByRole('button', { name: 'Build documents' }));
}

beforeEach(() => {
  mocks.savePdf.mockReset();
  mocks.downloadBlob.mockReset();
  mocks.exportDocx.mockClear();
  mocks.exportCoverLetterDocx.mockClear();
});

describe('guided exports', () => {
  it('downloads PDF and Word with guided filenames', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided();
    await toReview(user);

    await user.click(screen.getByRole('button', { name: 'Download résumé as PDF' }));
    await waitFor(() =>
      expect(mocks.savePdf).toHaveBeenCalledWith('Jordan-Avery_Senior-Product-Engineer_Resume.pdf'),
    );

    await user.click(screen.getByRole('button', { name: 'Download résumé as Word' }));
    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalledTimes(1));
    expect(mocks.downloadBlob.mock.calls[0][1]).toBe(
      'Jordan-Avery_Senior-Product-Engineer_Resume.docx',
    );
    expect(mocks.exportDocx).toHaveBeenCalledTimes(1);
  });

  it('downloads both formats for the active document', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided();
    await toReview(user);

    await user.click(screen.getByRole('button', { name: 'Download résumé in both formats' }));
    await waitFor(() => expect(mocks.downloadBlob).toHaveBeenCalledTimes(1));
    expect(mocks.savePdf).toHaveBeenCalledWith('Jordan-Avery_Senior-Product-Engineer_Resume.pdf');
    expect(mocks.downloadBlob.mock.calls[0][1]).toBe(
      'Jordan-Avery_Senior-Product-Engineer_Resume.docx',
    );
  });

  it('uses the cover-letter filename when exporting the letter', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided();
    await user.click(screen.getByRole('radio', { name: 'ChatGPT' }));
    await user.click(screen.getByRole('checkbox', { name: /I have opened my AI assistant/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('radio', { name: /Résumé \+ cover letter/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    const kit = `=== OPENRESUME: RESUME ===
${SAMPLE_RESUME_TEXT}

=== OPENRESUME: COVER LETTER ===
# Jordan Avery
jordan.avery@example.com | Toronto, ON

## BODY
I am writing to apply for the role.

Sincerely,
Jordan Avery`;
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: kit },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));
    await user.click(screen.getByRole('tab', { name: 'Cover letter' }));

    await user.click(screen.getByRole('button', { name: 'Download cover letter as PDF' }));
    await waitFor(() =>
      expect(mocks.savePdf).toHaveBeenCalledWith(
        'Jordan-Avery_Senior-Product-Engineer_Cover_Letter.pdf',
      ),
    );
  });
});
