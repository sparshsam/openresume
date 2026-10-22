import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import {
  APPLICATION_KIT_AI_INSTRUCTIONS,
  COVER_LETTER_AI_INSTRUCTIONS,
  RESUME_AI_INSTRUCTIONS,
} from '../src/lib/aiInstructions';
import { APP_VERSION } from '../src/lib/appMeta';
import { SAMPLE_COVER_LETTER_TEXT, createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { createSampleResume, SAMPLE_RESUME_TEXT } from '../src/lib/sample';
import { COVER_LETTER_DELIMITER, RESUME_DELIMITER } from '../src/lib/applicationKitFormat';
import { parseApplicationKit } from '../src/lib/parseApplicationKit';
import { COVER_LETTER_DRAFT_KEY, DRAFT_KEY } from '../src/lib/storage';
import { DEFAULT_DOCUMENT_ACCENT, DOCUMENT_ACCENTS } from '../src/lib/tokens';
import { THEME_KEY } from '../src/lib/theme';

const writeText = vi.fn();

const APPLICATION_KIT_TEXT = `=== OPENRESUME: RESUME ===\n${SAMPLE_RESUME_TEXT}\n\n=== OPENRESUME: COVER LETTER ===\n${SAMPLE_COVER_LETTER_TEXT}`;

function rgb(hex: string): string {
  const value = hex.replace('#', '');
  return `rgb(${Number.parseInt(value.slice(0, 2), 16)}, ${Number.parseInt(value.slice(2, 4), 16)}, ${Number.parseInt(value.slice(4, 6), 16)})`;
}

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

function renderAt(path: string) {
  window.history.replaceState({}, '', path);
  return renderApp();
}

function installClipboardMock() {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

function mockSystemTheme(dark: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

async function openPrepare(
  user: ReturnType<typeof userEvent.setup>,
  kind: 'resume' | 'coverLetter',
) {
  await user.click(
    screen.getByRole('button', {
      name: kind === 'resume' ? 'Build Resume' : 'Build Cover Letter',
    }),
  );
}

async function buildDocument(
  user: ReturnType<typeof userEvent.setup>,
  kind: 'resume' | 'coverLetter',
  text: string,
) {
  await openPrepare(user, kind);
  const textarea = screen.getByLabelText(
    kind === 'resume' ? 'Resume text' : 'Cover letter text',
  ) as HTMLTextAreaElement;
  fireEvent.change(textarea, { target: { value: text } });
  await user.click(
    screen.getByRole('button', {
      name: kind === 'resume' ? 'Build Resume' : 'Build Cover Letter',
    }),
  );
}

async function renderAndBuild(
  user: ReturnType<typeof userEvent.setup>,
  kind: 'resume' | 'coverLetter',
  text: string,
) {
  renderApp();
  await buildDocument(user, kind, text);
}

async function buildSampleResume(user: ReturnType<typeof userEvent.setup>) {
  await renderAndBuild(user, 'resume', SAMPLE_RESUME_TEXT);
}

async function buildSampleCoverLetter(user: ReturnType<typeof userEvent.setup>) {
  await renderAndBuild(user, 'coverLetter', SAMPLE_COVER_LETTER_TEXT);
}

async function buildApplicationKit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
  fireEvent.change(screen.getByLabelText('Application kit text'), {
    target: { value: APPLICATION_KIT_TEXT },
  });
  await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
}

async function goHome(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: /OpenResume home|Back to document selection/ }),
  );
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  mockSystemTheme(false);
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

describe('landing and navigation', () => {
  it('shows the three document choices before either document exists', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cover Letter' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Application Kit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Cover Letter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Application Kit' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Copy AI Instructions' })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Open resume' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open cover letter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open application kit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Formatting' })).not.toBeInTheDocument();
  });

  it('copies each homepage template without entering the builder', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    renderApp();
    const copyButtons = screen.getAllByRole('button', { name: 'Copy AI Instructions' });

    await user.click(copyButtons[0]);
    expect(writeText).toHaveBeenLastCalledWith(RESUME_AI_INSTRUCTIONS);
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();

    await user.click(copyButtons[1]);
    expect(writeText).toHaveBeenLastCalledWith(COVER_LETTER_AI_INSTRUCTIONS);
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();

    await user.click(copyButtons[2]);
    expect(writeText).toHaveBeenLastCalledWith(APPLICATION_KIT_AI_INSTRUCTIONS);
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();
    expect(
      (await screen.findAllByText('AI instructions copied. Paste them into your AI assistant.'))
        .length,
    ).toBeGreaterThan(0);
  });

  it('operates the homepage copy button with the keyboard', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    renderApp();
    const copyButtons = screen.getAllByRole('button', { name: 'Copy AI Instructions' });
    copyButtons[2].focus();
    await user.keyboard('{Enter}');

    expect(writeText).toHaveBeenCalledWith(APPLICATION_KIT_AI_INSTRUCTIONS);
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();
  });

  it('opens Application Kit preparation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));

    expect(
      screen.getByRole('heading', { name: 'Create your application kit' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Application kit text')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Build Application Kit' })).toBeInTheDocument();
    const workflow = screen.getByRole('list', { name: 'AI workflow' });
    expect(within(workflow).getAllByRole('listitem')).toHaveLength(6);
    expect(within(workflow).getAllByRole('listitem')[5]).toHaveTextContent('Build both documents.');
  });

  it('shows combined-parser errors inline', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
    fireEvent.change(screen.getByLabelText('Application kit text'), {
      target: { value: 'not a combined document' },
    });
    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));

    expect(screen.getByRole('alert')).toHaveTextContent('=== OPENRESUME: RESUME ===');
    expect(screen.getByLabelText('Application kit text')).toHaveValue('not a combined document');
  });

  it('routes to the matching preparation screen and back', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Build Resume' }));
    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('Resume text')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /^← Back$/ }));
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));
    expect(screen.getByRole('heading', { name: 'Create your cover letter' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cover letter text')).toHaveValue('');
  });

  it('Build Resume always opens preparation when a resume exists in this session', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await goHome(user);

    await user.click(screen.getByRole('button', { name: 'Build Resume' }));

    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('Resume text')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Copy AI Instructions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load Example' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Resume' })).toBeInTheDocument();
  });

  it('Build Cover Letter always opens preparation when a letter exists', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleCoverLetter(user);
    await goHome(user);

    await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));

    expect(screen.getByRole('heading', { name: 'Create your cover letter' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cover letter text')).toHaveValue('');
  });

  it('keeps both documents available while navigating in one session', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    await buildDocument(user, 'resume', SAMPLE_RESUME_TEXT);
    const resumeName = screen.getByLabelText('Name');
    await user.clear(resumeName);
    await user.type(resumeName, 'Session Resumer');

    await goHome(user);
    await buildDocument(user, 'coverLetter', SAMPLE_COVER_LETTER_TEXT);

    await goHome(user);
    expect(screen.getByRole('button', { name: 'Open resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open cover letter' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open resume' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Session Resumer');

    await goHome(user);
    await user.click(screen.getByRole('button', { name: 'Open cover letter' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('keeps the current document when leaving preparation and returning', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);

    await user.click(screen.getByRole('button', { name: 'New resume' }));
    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^← Back$/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('replaces a document without confirmation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'New resume' }));

    fireEvent.change(screen.getByLabelText('Resume text'), {
      target: { value: '# Replacement\nreplacement@example.com' },
    });

    const confirm = vi.spyOn(window, 'confirm');
    const alert = vi.spyOn(window, 'alert');
    const prompt = vi.spyOn(window, 'prompt');

    await user.click(screen.getByRole('button', { name: 'Build Resume' }));

    expect(confirm).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('Replacement');
  });

  it('does not restore legacy drafts after reload and identifies them safely', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(createSampleResume()));
    localStorage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify(createSampleCoverLetter()));
    localStorage.setItem('another-app:data', '{"keep":true}');
    localStorage.setItem(THEME_KEY, 'dark');

    renderApp();

    expect(screen.queryByRole('button', { name: 'Open resume' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open cover letter' })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(localStorage.getItem(COVER_LETTER_DRAFT_KEY)).toBeNull();
    });
    expect(localStorage.getItem('another-app:data')).toBe('{"keep":true}');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('keeps session documents out of localStorage across a remount', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const { unmount } = renderApp();
    await buildDocument(user, 'resume', SAMPLE_RESUME_TEXT);

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(localStorage.getItem(COVER_LETTER_DRAFT_KEY)).toBeNull();

    unmount();
    renderApp();

    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open resume' })).not.toBeInTheDocument();
  });
});

describe('resume workflow', () => {
  it('builds a resume from prepared text', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await renderAndBuild(
      user,
      'resume',
      ['# Prepared Person', 'prepared@example.com', '', '## SUMMARY', 'Prepared body.'].join('\n'),
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Prepared Person');
    expect(screen.getByText('Prepared Person')).toBeInTheDocument();
    expect(screen.getAllByText(/Prepared body/).length).toBeGreaterThan(0);
    expect(screen.getByText('Resume built.')).toBeInTheDocument();
  });

  it('edits the resume in memory without writing document content to storage', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Ada Lovelace');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(screen.queryByText(/Saved locally|Saving…|No saved draft/)).not.toBeInTheDocument();
  });

  it('shows resume formatting controls', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    expect(screen.getByLabelText('Bullet spacing')).toBeInTheDocument();
    expect(screen.getByLabelText('Column spacing')).toBeInTheDocument();
    expect(screen.queryByLabelText('Paragraph spacing')).not.toBeInTheDocument();
    expect(screen.getByText('Accent Colour')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(DOCUMENT_ACCENTS.length);
    expect(screen.getByRole('radio', { name: 'Green' })).toBeChecked();
  });

  it('selects every accent colour and updates the preview', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    const previewName = within(screen.getByLabelText('Resume preview')).getByText('Jordan Avery');

    for (const accent of DOCUMENT_ACCENTS) {
      const radio = screen.getByRole('radio', { name: accent.name });
      await user.click(radio);
      expect(radio).toBeChecked();
      expect(document.querySelector('.accent-name')).toHaveTextContent(accent.name);
      expect(previewName.style.color).toBe(rgb(accent.value));
    }
  });

  it('resets the document accent to green', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Blue' }));
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));

    expect(screen.getByRole('radio', { name: 'Green' })).toBeChecked();
    expect(
      within(screen.getByLabelText('Resume preview')).getByText('Jordan Avery').style.color,
    ).toBe(rgb(DEFAULT_DOCUMENT_ACCENT));
  });

  it('keeps resume and cover letter accent colours independent', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildDocument(user, 'resume', SAMPLE_RESUME_TEXT);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Blue' }));

    await goHome(user);
    await buildDocument(user, 'coverLetter', SAMPLE_COVER_LETTER_TEXT);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Red' }));

    await goHome(user);
    await user.click(screen.getByRole('button', { name: 'Open resume' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();

    await goHome(user);
    await user.click(screen.getByRole('button', { name: 'Open cover letter' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });

  it('does not persist accent colours across a remount', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const first = renderApp();
    await buildDocument(user, 'resume', SAMPLE_RESUME_TEXT);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Purple' }));
    expect(screen.getByRole('radio', { name: 'Purple' })).toBeChecked();

    first.unmount();
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('radio', { name: 'Green' })).toBeChecked();
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });

  it('preserves accent colour across information-page navigation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Teal' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    await user.click(screen.getByRole('link', { name: 'About' }));
    await user.click(screen.getByRole('link', { name: 'Privacy' }));
    await user.click(screen.getAllByRole('link', { name: /Back to builder/ })[0]);

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('radio', { name: 'Teal' })).toBeChecked();
    expect(
      within(screen.getByLabelText('Resume preview')).getByText('Jordan Avery').style.color,
    ).toBe(rgb(DOCUMENT_ACCENTS.find((accent) => accent.name === 'Teal')!.value));
  });

  it('rejects concatenated resumes with inline validation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');
    fireEvent.change(screen.getByLabelText('Resume text'), {
      target: { value: '# First\nfirst@example.com\n\n# Second\nsecond@example.com' },
    });
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/2 resume headings/);
  });

  it('requires content before building', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Paste resume text before building/);
  });
});

describe('cover letter workflow', () => {
  it('builds and edits a cover letter', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleCoverLetter(user);

    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getByLabelText('Position or subject (optional)')).toHaveValue(
      'Senior Product Engineer',
    );
    const preview = screen.getByLabelText('Resume preview');
    expect(within(preview).getAllByText(/Brightline Labs/).length).toBeGreaterThan(0);

    const date = screen.getByLabelText('Date (optional)');
    await user.clear(date);
    await user.type(date, 'November 1, 2026');
    expect(within(preview).getByText(/November 1, 2026/)).toBeInTheDocument();

    const paragraph = screen.getByLabelText('Paragraph 1');
    await user.clear(paragraph);
    await user.type(paragraph, 'Updated letter body.');
    expect(within(preview).getByText(/Updated letter body/)).toBeInTheDocument();

    expect(localStorage.getItem(COVER_LETTER_DRAFT_KEY)).toBeNull();
  });

  it('adds and removes body paragraphs', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleCoverLetter(user);

    expect(screen.getAllByLabelText(/^Paragraph \d+$/)).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Add paragraph' }));
    expect(screen.getAllByLabelText(/^Paragraph \d+$/)).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Remove paragraph 4' }));
    expect(screen.getAllByLabelText(/^Paragraph \d+$/)).toHaveLength(3);
  });

  it('shows cover letter formatting controls', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleCoverLetter(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    expect(screen.getByLabelText('Paragraph spacing')).toBeInTheDocument();
    expect(screen.queryByLabelText('Bullet spacing')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Column spacing')).not.toBeInTheDocument();
    expect(screen.getByText('Accent Colour')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Green' })).toBeChecked();
  });

  it('validates a cover letter without a body', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'coverLetter');
    fireEvent.change(screen.getByLabelText('Cover letter text'), {
      target: { value: '# A Person\n\n## DATE\nOctober 18, 2026' },
    });
    await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/BODY section/);
  });
});

describe('matching cover letter flow', () => {
  it('reuses resume identity without changing the resume', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);

    await user.click(screen.getByRole('button', { name: /Create matching cover letter/i }));
    expect(screen.getByRole('heading', { name: 'Create your cover letter' })).toBeInTheDocument();
    const textarea = screen.getByLabelText('Cover letter text') as HTMLTextAreaElement;
    expect(textarea.value).toContain('# Jordan Avery');
    expect(textarea.value).toContain('jordan.avery@example.com');
    expect(
      screen.getByText(/Applicant details from your resume are pre-filled/),
    ).toBeInTheDocument();

    const complete = textarea.value.replace('## BODY\n', '## BODY\nI am applying for this role.');
    fireEvent.change(textarea, { target: { value: complete } });
    await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));

    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getAllByText(/I am applying for this role/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Back to resume/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getAllByText(/Product-minded software generalist/).length).toBeGreaterThan(0);
  });

  it('offers resume details from the regular cover letter preparation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await goHome(user);
    await openPrepare(user, 'coverLetter');

    await user.click(screen.getByRole('button', { name: 'Use resume details' }));
    const textarea = screen.getByLabelText('Cover letter text') as HTMLTextAreaElement;
    expect(textarea.value).toContain('# Jordan Avery');
    expect(textarea.value).toContain('jordan.avery@example.com');
  });
});

describe('application kit workflow', () => {
  it('builds both documents and opens the combined workspace', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    expect(
      screen.getByText('Application kit built. Review both documents before exporting.'),
    ).toBeInTheDocument();
    expect(within(screen.getByRole('banner')).getByText('Application Kit')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Resume' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Cover Letter' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getByRole('button', { name: 'Download combined PDF' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download combined Word document' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Download separately')).toBeInTheDocument();
  });

  it('switches tabs without losing either document', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Kit Resumer');
    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Letter Writer');
    await user.click(screen.getByRole('tab', { name: 'Resume' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Kit Resumer');

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Letter Writer');
  });

  it('supports arrow-key tab navigation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    const resumeTab = screen.getByRole('tab', { name: 'Resume' });
    resumeTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Cover Letter' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Cover Letter' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Resume' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Resume' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Cover Letter' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Resume' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps resume and cover letter formatting independent inside the kit', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Blue' }));

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('radio', { name: 'Red' }));

    await user.click(screen.getByRole('tab', { name: 'Resume' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('radio', { name: 'Blue' })).toBeChecked();

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('radio', { name: 'Red' })).toBeChecked();
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });

  it('does not replace existing documents when the kit fails validation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildDocument(user, 'resume', SAMPLE_RESUME_TEXT);
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Prior Resumer');
    await goHome(user);

    await buildDocument(user, 'coverLetter', SAMPLE_COVER_LETTER_TEXT);
    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Prior Letter');
    await goHome(user);

    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
    fireEvent.change(screen.getByLabelText('Application kit text'), {
      target: { value: 'not a valid kit' },
    });
    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('=== OPENRESUME: RESUME ===');

    await user.click(screen.getByRole('button', { name: /^← Back$/ }));
    await user.click(screen.getByRole('button', { name: 'Open resume' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Prior Resumer');

    await goHome(user);
    await user.click(screen.getByRole('button', { name: 'Open cover letter' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Prior Letter');
  });

  it('offers Open application kit only after a kit is built', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await goHome(user);

    expect(screen.queryByRole('button', { name: 'Open application kit' })).not.toBeInTheDocument();

    await buildApplicationKit(user);
    await goHome(user);
    const openKit = screen.getByRole('button', { name: 'Open application kit' });
    await user.click(openKit);

    expect(screen.getByRole('tab', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('preserves the kit across public-page navigation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);
    await goHome(user);

    await user.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'About' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your documents. Your words.',
    );

    await user.click(screen.getAllByRole('link', { name: 'Back to builder' })[0]);
    await user.click(screen.getByRole('button', { name: 'Open application kit' }));
    expect(screen.getByRole('tab', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('loads a combinable kit example and builds both documents', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
    await user.click(screen.getByRole('button', { name: 'Load Example' }));

    const textarea = screen.getByLabelText('Application kit text') as HTMLTextAreaElement;
    expect(textarea.value).toContain(RESUME_DELIMITER);
    expect(textarea.value).toContain(COVER_LETTER_DELIMITER);
    expect(textarea.value.indexOf(RESUME_DELIMITER)).toBeLessThan(
      textarea.value.indexOf(COVER_LETTER_DELIMITER),
    );

    const parsed = parseApplicationKit(textarea.value);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.resume.header.name).toBe('Jordan Avery');
      expect(parsed.coverLetter.applicant.name).toBe('Jordan Avery');
      expect(parsed.resume.sections.length).toBeGreaterThan(0);
      expect(parsed.coverLetter.body.length).toBeGreaterThan(0);
    }

    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Resume' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getAllByText('EXPERIENCE').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getAllByText('Dear Ms. Lee,').length).toBeGreaterThan(0);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('builds a kit without making a network request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('surfaces a cross-document inconsistency warning', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const mismatched = APPLICATION_KIT_TEXT.replace('# Jordan Avery', '# Jordan A. Avery');
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
    fireEvent.change(screen.getByLabelText('Application kit text'), {
      target: { value: mismatched },
    });
    await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));

    expect(screen.getByText(/different applicant names/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Resume' })).toBeInTheDocument();
  });

  it('clears the kit on reload without persisting document content', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const first = renderApp();
    await buildApplicationKit(user);
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);

    first.unmount();
    renderApp();

    expect(screen.queryByRole('button', { name: 'Open application kit' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();
  });
});

describe('feedback and AI instructions', () => {
  it('copies the complete resume instructions with feedback', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));

    expect(writeText).toHaveBeenCalledWith(RESUME_AI_INSTRUCTIONS);
    expect(
      await screen.findByText('AI instructions copied. Paste them into your AI assistant.'),
    ).toBeInTheDocument();
  });

  it('shows the six-step AI workflow on the preparation screen', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');

    const workflow = screen.getByRole('list', { name: 'AI workflow' });
    const steps = within(workflow).getAllByRole('listitem');
    expect(steps).toHaveLength(6);
    expect(steps[0]).toHaveTextContent('Copy AI Instructions.');
    expect(steps[5]).toHaveTextContent('Build the document.');
  });

  it('copies instructions without making a network request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));

    expect(writeText).toHaveBeenCalledWith(RESUME_AI_INSTRUCTIONS);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('copies the complete cover letter instructions', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    renderApp();
    await openPrepare(user, 'coverLetter');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));
    expect(writeText).toHaveBeenCalledWith(COVER_LETTER_AI_INSTRUCTIONS);
  });

  it('shows an error toast when copying fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    writeText.mockRejectedValueOnce(new Error('blocked'));
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));

    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument();
  });

  it('builds a fenced document without persisting it', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await renderAndBuild(user, 'resume', `\`\`\`text\n${SAMPLE_RESUME_TEXT}\n\`\`\``);

    expect(screen.getByText('Resume built.')).toBeInTheDocument();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });

  it('dismisses a toast accessibly', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    expect(screen.getByText('Resume built.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Resume built.')).not.toBeInTheDocument();
  });

  it('loads the resume example without copying instructions', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));

    expect(screen.getByLabelText('Resume text')).toHaveValue(SAMPLE_RESUME_TEXT);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('Example input format')).not.toBeInTheDocument();
  });

  it('loads the cover letter example', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'coverLetter');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));

    expect(screen.getByLabelText('Cover letter text')).toHaveValue(SAMPLE_COVER_LETTER_TEXT);
    expect(screen.getByLabelText('Cover letter text')).not.toHaveValue(SAMPLE_RESUME_TEXT);
  });

  it('supports Escape and Ctrl+Enter from preparation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();

    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));
    const textarea = screen.getByLabelText('Resume text');
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });
});

describe('public information pages', () => {
  it('renders About, Privacy, and Terms directly with their metadata', () => {
    const about = renderAt('/about');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Your documents. Your words. Your next opportunity.',
      }),
    ).toBeInTheDocument();
    expect(document.title).toBe('About OpenResume');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://resume.kovina.org/about',
    );
    about.unmount();

    const privacy = renderAt('/privacy');
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(document.title).toBe('Privacy Policy — OpenResume');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://resume.kovina.org/privacy',
    );
    privacy.unmount();

    renderAt('/terms');
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument();
    expect(document.title).toBe('Terms of Use — OpenResume');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://resume.kovina.org/terms',
    );
  });

  it('keeps header and footer on every information page', () => {
    renderAt('/about');

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OpenResume home' })).toBeInTheDocument();
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Terms' })).toBeInTheDocument();
  });

  it('navigates between information pages without reloading and preserves theme', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderAt('/about');
    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    await user.click(
      within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Privacy' }),
    );
    expect(window.location.pathname).toBe('/privacy');
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    await user.click(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Terms' }));
    expect(window.location.pathname).toBe('/terms');
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('supports back and forward between the builder and information pages', () => {
    window.history.replaceState({}, '', '/about');
    renderApp();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your documents. Your words.',
    );

    act(() => {
      window.history.pushState({}, '', '/privacy');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();

    act(() => {
      window.history.pushState({}, '', '/about');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your documents. Your words.',
    );
  });

  it('preserves in-memory documents across information-page navigation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Session Builder');

    await user.click(screen.getByRole('link', { name: 'About' }));
    expect(window.location.pathname).toBe('/about');

    await user.click(screen.getAllByRole('link', { name: /Back to builder/ })[0]);
    expect(window.location.pathname).toBe('/');
    expect(screen.getByLabelText('Name')).toHaveValue('Session Builder');

    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });

  it('keeps the footer available from preparation and workspace views', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^← Back$/ }));
    await buildDocument(user, 'resume', SAMPLE_RESUME_TEXT);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
  });
});

describe('resume layout selection', () => {
  it('offers the professional two-column template by default', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    const layout = screen.getByLabelText('Resume layout') as HTMLSelectElement;
    expect(layout.value).toBe('twoColumn');
    expect(
      within(layout).getByRole('option', { name: 'Professional Two-Column' }),
    ).toBeInTheDocument();
    expect(
      within(layout).getByRole('option', { name: 'ATS Simple (single column)' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Column spacing')).toBeInTheDocument();
    expect(screen.queryByText(/No layout can guarantee compatibility/)).not.toBeInTheDocument();
  });

  it('does not offer a resume layout control for cover letters', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleCoverLetter(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    expect(screen.queryByLabelText('Resume layout')).not.toBeInTheDocument();
  });

  it('switches to ATS Simple without losing content and reflows the preview', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    const pagesBefore = document.querySelectorAll('.page').length;

    await user.selectOptions(screen.getByLabelText('Resume layout'), 'atsSimple');

    expect(screen.getByLabelText('Resume layout')).toHaveValue('atsSimple');
    expect(screen.queryByLabelText('Column spacing')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Column for /)).not.toBeInTheDocument();
    expect(screen.getByText(/No layout can guarantee compatibility/)).toBeInTheDocument();

    const preview = screen.getByLabelText('Resume preview');
    expect(within(preview).getByText('Jordan Avery')).toBeInTheDocument();
    expect(within(preview).getAllByText('EXPERIENCE').length).toBeGreaterThan(0);
    expect(within(preview).getAllByText('SKILLS').length).toBeGreaterThan(0);

    const pagesAfter = document.querySelectorAll('.page').length;
    expect(pagesAfter).toBeGreaterThan(pagesBefore);

    await user.selectOptions(screen.getByLabelText('Resume layout'), 'twoColumn');
    expect(screen.getByLabelText('Column spacing')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/^Column for /).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.page').length).toBe(pagesBefore);
    expect(
      within(screen.getByLabelText('Resume preview')).getByText('Jordan Avery'),
    ).toBeInTheDocument();
  });

  it('keeps the layout independent per document and out of storage', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.selectOptions(screen.getByLabelText('Resume layout'), 'atsSimple');

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.queryByLabelText('Resume layout')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Resume' }));
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByLabelText('Resume layout')).toHaveValue('atsSimple');
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });

  it('resets the layout to the default with the other formatting', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.selectOptions(screen.getByLabelText('Resume layout'), 'atsSimple');

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(screen.getByLabelText('Resume layout')).toHaveValue('twoColumn');
  });
});

describe('application kit document order', () => {
  it('defaults to cover letter then resume and can be reversed', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    const order = screen.getByLabelText('Document order') as HTMLSelectElement;
    expect(order.value).toBe('coverLetterFirst');
    expect(
      within(order).getByRole('option', { name: 'Cover Letter → Resume' }),
    ).toBeInTheDocument();
    expect(
      within(order).getByRole('option', { name: 'Resume → Cover Letter' }),
    ).toBeInTheDocument();

    await user.selectOptions(order, 'resumeFirst');
    expect(screen.getByLabelText('Document order')).toHaveValue('resumeFirst');

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    expect(screen.getByLabelText('Document order')).toHaveValue('resumeFirst');
  });

  it('is session-only and is not written to storage', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildApplicationKit(user);

    await user.selectOptions(screen.getByLabelText('Document order'), 'resumeFirst');
    expect(Object.keys(localStorage).filter((key) => key !== THEME_KEY)).toEqual([]);
  });
});

describe('header, theme, and footer', () => {
  it('shows context actions and the document label in the workspace', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);

    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Formatting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Word document' })).toBeInTheDocument();
  });

  it('toggles and persists the theme', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: /switch to light mode/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('keeps one brand mark and favicon while the theme changes the chrome', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.dataset.favicon = '32';
    document.head.append(favicon);

    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#f4f5f2';
    document.head.append(themeColor);

    const { container } = renderApp();
    const mark = container.querySelector('.brand-mark') as HTMLImageElement;

    expect(favicon.href).toContain('/favicon-32.png');
    expect(themeColor.content).toBe('#f4f5f2');
    expect(mark.getAttribute('src')).toBe('/icon-192.png');

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));

    expect(favicon.href).toContain('/favicon-32.png');
    expect(themeColor.content).toBe('#0f1210');
    expect(mark.getAttribute('src')).toBe('/icon-192.png');

    favicon.remove();
    themeColor.remove();
  });

  it('uses the light artwork when the system theme is dark', () => {
    mockSystemTheme(true);
    const { container } = renderApp();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(container.querySelector('.brand-mark')?.getAttribute('src')).toBe('/icon-192.png');
  });

  it('restores a stored theme and follows the system when unset', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    const { unmount } = renderApp();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    unmount();

    localStorage.removeItem(THEME_KEY);
    document.documentElement.removeAttribute('data-theme');
    mockSystemTheme(true);
    renderApp();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('keeps the resume document colors fixed in dark mode', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    const preview = screen.getByLabelText('Resume preview');
    const name = within(preview).getByText('Jordan Avery');
    const before = name.style.color;

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(name.style.color).toBe(before);
    expect(name.style.color.toLowerCase()).toMatch(/14532d|rgb\(20, 83, 45\)/);
  });

  it('renders the footer with version, attribution, and links', () => {
    renderApp();
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(`v${APP_VERSION}`);
    expect(footer).toHaveTextContent(/Kovina/);
    expect(within(footer).getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Terms' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'MIT license' })).toBeInTheDocument();
  });
});
