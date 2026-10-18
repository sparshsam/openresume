import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { COVER_LETTER_AI_INSTRUCTIONS, RESUME_AI_INSTRUCTIONS } from '../src/lib/aiInstructions';
import { APP_VERSION } from '../src/lib/appMeta';
import { SAMPLE_COVER_LETTER_TEXT, createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { createSampleResume, SAMPLE_RESUME_TEXT } from '../src/lib/sample';
import { COVER_LETTER_DRAFT_KEY, DRAFT_KEY } from '../src/lib/storage';
import { THEME_KEY } from '../src/lib/theme';

const writeText = vi.fn();

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

function seedResume(resume = createSampleResume()) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(resume));
}

function seedCoverLetter(letter = createSampleCoverLetter()) {
  localStorage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify(letter));
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
  renderApp();
  await user.click(
    screen.getByRole('button', {
      name: kind === 'resume' ? /Build Resume/i : /Build Cover Letter/i,
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

async function openSavedResume(user: ReturnType<typeof userEvent.setup>) {
  renderApp();
  await user.click(screen.getByRole('button', { name: /Build Resume/i }));
}

async function openSavedCoverLetter(user: ReturnType<typeof userEvent.setup>) {
  renderApp();
  await user.click(screen.getByRole('button', { name: /Build Cover Letter/i }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  mockSystemTheme(false);
  window.confirm = () => true;
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

describe('landing and navigation', () => {
  it('shows the two document options without saved drafts', () => {
    renderApp();

    expect(
      screen.getByRole('heading', { name: /Build a document that feels considered/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build Cover Letter/i })).toBeInTheDocument();
    expect(screen.getAllByText('Start from structured text')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Formatting' })).not.toBeInTheDocument();
  });

  it('routes to the matching preparation screen and back', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    await user.click(screen.getByRole('button', { name: /Build Resume/i }));
    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('Resume text')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /^← Back$/ }));
    expect(
      screen.getByRole('heading', { name: /Build a document that feels considered/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Build Cover Letter/i }));
    expect(screen.getByRole('heading', { name: 'Create your cover letter' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cover letter text')).toHaveValue('');
  });

  it('opens saved drafts from the landing page and shows draft badges', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    seedCoverLetter();
    renderApp();

    expect(screen.getAllByText('Draft saved · Continue')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Build Resume/i }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');

    await user.click(screen.getByRole('button', { name: 'Back to document selection' }));
    await user.click(screen.getByRole('button', { name: /Build Cover Letter/i }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getByLabelText('Position or subject (optional)')).toHaveValue(
      'Senior Product Engineer',
    );
  });

  it('loads a v0.1.2 resume draft safely', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const legacy = {
      ...createSampleResume(),
      template: { pageSize: 'a4', accent: '#14532D' },
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(legacy));
    renderApp();

    expect(screen.getAllByText('Draft saved · Continue')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Build Resume/i }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });
});

describe('resume workflow', () => {
  it('builds a resume from prepared text', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildDocument(
      user,
      'resume',
      ['# Prepared Person', 'prepared@example.com', '', '## SUMMARY', 'Prepared body.'].join('\n'),
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Prepared Person');
    expect(screen.getByText('Prepared Person')).toBeInTheDocument();
    expect(screen.getAllByText(/Prepared body/).length).toBeGreaterThan(0);
  });

  it('edits the resume preview and persists the draft', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    await openSavedResume(user);

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Ada Lovelace');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('Ada Lovelace');
    });
  });

  it('shows resume formatting controls', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    await openSavedResume(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    expect(screen.getByLabelText('Bullet spacing')).toBeInTheDocument();
    expect(screen.getByLabelText('Column spacing')).toBeInTheDocument();
    expect(screen.queryByLabelText('Paragraph spacing')).not.toBeInTheDocument();
  });

  it('returns to preparation on New and preserves the draft on Back', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    await openSavedResume(user);

    await user.click(screen.getByRole('button', { name: 'New resume' }));
    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(localStorage.getItem(DRAFT_KEY)).toContain('Jordan Avery');

    await user.click(screen.getByRole('button', { name: /^← Back$/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('confirms before replacing an existing resume', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    await openSavedResume(user);
    await user.click(screen.getByRole('button', { name: 'New resume' }));

    const textarea = screen.getByLabelText('Resume text') as HTMLTextAreaElement;
    fireEvent.change(textarea, {
      target: { value: '# Replacement\nreplacement@example.com' },
    });

    window.confirm = vi.fn(() => false);
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));
    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(window.confirm).toHaveBeenCalled();

    window.confirm = vi.fn(() => true);
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Replacement');
  });

  it('rejects concatenated resumes', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await openPrepare(user, 'resume');
    const textarea = screen.getByLabelText('Resume text');
    fireEvent.change(textarea, {
      target: { value: '# First\nfirst@example.com\n\n# Second\nsecond@example.com' },
    });
    await user.click(screen.getByRole('button', { name: 'Build Resume' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/2 resume headings/);
  });
});

describe('cover letter workflow', () => {
  it('builds and edits a cover letter', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildDocument(user, 'coverLetter', SAMPLE_COVER_LETTER_TEXT);

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
  });

  it('adds and removes body paragraphs', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedCoverLetter();
    await openSavedCoverLetter(user);

    expect(screen.getAllByLabelText(/^Paragraph \d+$/)).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Add paragraph' }));
    expect(screen.getAllByLabelText(/^Paragraph \d+$/)).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Remove paragraph 4' }));
    expect(screen.getAllByLabelText(/^Paragraph \d+$/)).toHaveLength(3);
  });

  it('shows cover letter formatting controls', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedCoverLetter();
    await openSavedCoverLetter(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    expect(screen.getByLabelText('Paragraph spacing')).toBeInTheDocument();
    expect(screen.queryByLabelText('Bullet spacing')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Column spacing')).not.toBeInTheDocument();
  });

  it('persists resume and cover letter drafts independently', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    seedCoverLetter();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Build Cover Letter/i }));

    const position = screen.getByLabelText('Position or subject (optional)');
    await user.clear(position);
    await user.type(position, 'Staff Engineer');

    await waitFor(() => {
      const letterRaw = localStorage.getItem(COVER_LETTER_DRAFT_KEY) ?? '';
      const resumeRaw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(letterRaw).toContain('Staff Engineer');
      expect(resumeRaw).toContain('Jordan Avery');
      expect(resumeRaw).not.toContain('Staff Engineer');
    });
  });

  it('validates a cover letter without a body', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await openPrepare(user, 'coverLetter');
    const textarea = screen.getByLabelText('Cover letter text');
    fireEvent.change(textarea, {
      target: { value: '# A Person\n\n## DATE\nOctober 18, 2026' },
    });
    await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/BODY section/);
  });
});

describe('matching cover letter flow', () => {
  it('reuses resume identity without changing the resume', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    await openSavedResume(user);
    const before = localStorage.getItem(DRAFT_KEY);

    await user.click(screen.getByRole('button', { name: /Create matching cover letter/i }));
    expect(screen.getByRole('heading', { name: 'Create your cover letter' })).toBeInTheDocument();
    const textarea = screen.getByLabelText('Cover letter text') as HTMLTextAreaElement;
    expect(textarea.value).toContain('# Jordan Avery');
    expect(textarea.value).toContain('jordan.avery@example.com');
    expect(
      screen.getByText(/Applicant details from your resume are pre-filled/),
    ).toBeInTheDocument();

    const complete = `${textarea.value.replace('## BODY\n', '## BODY\nI am applying for this role.')}`;
    fireEvent.change(textarea, { target: { value: complete } });
    await user.click(screen.getByRole('button', { name: 'Build Cover Letter' }));

    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getAllByText(/I am applying for this role/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Back to resume/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');

    const after = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as {
      header?: { name?: string };
      sections?: unknown[];
    };
    const original = JSON.parse(before ?? '{}') as {
      header?: { name?: string };
      sections?: unknown[];
    };
    expect(after.header?.name).toBe(original.header?.name);
    expect(after.sections).toEqual(original.sections);
    expect(JSON.stringify(after)).not.toContain('I am applying for this role');
  });

  it('offers resume details from the regular cover letter preparation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    renderApp();
    await user.click(screen.getByRole('button', { name: /Build Cover Letter/i }));

    await user.click(screen.getByRole('button', { name: 'Use resume details' }));
    const textarea = screen.getByLabelText('Cover letter text') as HTMLTextAreaElement;
    expect(textarea.value).toContain('# Jordan Avery');
    expect(textarea.value).toContain('jordan.avery@example.com');
  });
});

describe('AI instructions and examples', () => {
  it('copies the complete resume instructions with feedback', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));

    expect(writeText).toHaveBeenCalledWith(RESUME_AI_INSTRUCTIONS);
    expect(screen.getByRole('status')).toHaveTextContent(/AI instructions copied/);
  });

  it('copies the complete cover letter instructions', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    await openPrepare(user, 'coverLetter');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));
    expect(writeText).toHaveBeenCalledWith(COVER_LETTER_AI_INSTRUCTIONS);
  });

  it('shows an error when copying fails', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    writeText.mockRejectedValueOnce(new Error('blocked'));
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));
    expect(await screen.findByText(/Could not copy/)).toBeInTheDocument();
  });

  it('loads the example without copying instructions', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));

    expect(screen.getByLabelText('Resume text')).toHaveValue(SAMPLE_RESUME_TEXT);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('Example input format')).not.toBeInTheDocument();
  });
});

describe('header, theme, and footer', () => {
  it('shows context actions and the document label in the workspace', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    seedResume();
    await openSavedResume(user);

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
    seedResume();
    await openSavedResume(user);
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
    expect(within(footer).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Input format' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'MIT license' })).toBeInTheDocument();
  });
});
