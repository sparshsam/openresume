import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  it('shows the two document choices before either document exists', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /Your next application/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cover Letter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build Cover Letter' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open resume' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open cover letter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Formatting' })).not.toBeInTheDocument();
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

describe('feedback and AI instructions', () => {
  it('copies the complete resume instructions with feedback', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    installClipboardMock();
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Copy AI Instructions' }));

    expect(writeText).toHaveBeenCalledWith(RESUME_AI_INSTRUCTIONS);
    expect(await screen.findByText('AI instructions copied.')).toBeInTheDocument();
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

  it('dismisses a toast accessibly', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    await buildSampleResume(user);
    expect(screen.getByText('Resume built.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Resume built.')).not.toBeInTheDocument();
  });

  it('loads the example without copying instructions', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await openPrepare(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));

    expect(screen.getByLabelText('Resume text')).toHaveValue(SAMPLE_RESUME_TEXT);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('Example input format')).not.toBeInTheDocument();
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

  it('switches the favicon, theme colour, and header mark with the theme', async () => {
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

    expect(favicon.href).toContain('/favicon-32-dark.png');
    expect(themeColor.content).toBe('#0f1210');
    expect(mark.getAttribute('src')).toBe('/icon-192-dark.png');

    favicon.remove();
    themeColor.remove();
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
