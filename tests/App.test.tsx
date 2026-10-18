import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { APP_VERSION } from '../src/lib/appMeta';
import { createSampleResume } from '../src/lib/sample';
import { DRAFT_KEY } from '../src/lib/storage';
import { THEME_KEY } from '../src/lib/theme';

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

function seedDraft(resume = createSampleResume()) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(resume));
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

async function submitImport(user: ReturnType<typeof userEvent.setup>, text: string) {
  const textarea = screen.getByLabelText('Resume text');
  fireEvent.change(textarea, { target: { value: text } });
  await user.click(screen.getByRole('button', { name: /import & preview/i }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.style.colorScheme = '';
  mockSystemTheme(false);
});

describe('first launch and returning users', () => {
  it('shows the import experience when no draft exists', async () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('Resume text')).toHaveValue('');
    expect(screen.getByRole('button', { name: /import & preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load example' })).toBeInTheDocument();
    expect(screen.getByText(/ChatGPT or any AI assistant/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByLabelText('Resume text')).toHaveFocus());
  });

  it('resumes a saved draft directly in the editor', () => {
    seedDraft();
    renderApp();

    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.queryByRole('heading', { name: 'Create your resume' })).not.toBeInTheDocument();
  });

  it('imports text from the first screen and saves a draft', async () => {
    const user = userEvent.setup();
    renderApp();

    await submitImport(
      user,
      ['# Imported Person', 'imported@example.com', '', '## SUMMARY', 'Only this.'].join('\n'),
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Imported Person');
    expect(screen.getByText('Imported Person')).toBeInTheDocument();

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('Imported Person');
    });
  });

  it('imports with Ctrl+Enter', async () => {
    renderApp();
    const textarea = screen.getByLabelText('Resume text');
    fireEvent.change(textarea, {
      target: { value: '# Keyboard Person\nkeyboard@example.com' },
    });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    expect(await screen.findByLabelText('Name')).toHaveValue('Keyboard Person');
  });

  it('returns to the current resume from the New screen', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'New resume' }));
    expect(screen.getByRole('heading', { name: 'Create your resume' })).toBeInTheDocument();
    expect(localStorage.getItem(DRAFT_KEY)).toContain('Jordan Avery');

    await user.click(screen.getByRole('button', { name: 'Back to current resume' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('returns to the editor with Escape from the New screen', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'New resume' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });
});

describe('import validation and replacement', () => {
  it('rejects empty input', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole('button', { name: /import & preview/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Paste resume text/);
  });

  it('rejects input without a name heading', async () => {
    const user = userEvent.setup();
    renderApp();
    await submitImport(user, 'Just some text without a heading.');
    expect(screen.getByRole('alert')).toHaveTextContent(/single "# Your Name" line/);
  });

  it('rejects concatenated resumes without changing the document', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Import resume' }));
    await submitImport(
      user,
      ['# First Person', 'first@example.com', '', '# Second Person', 'second@example.com'].join(
        '\n',
      ),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/2 resume headings/);

    await user.click(screen.getByRole('button', { name: 'Back to current resume' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('replaces the whole document on a second import', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Import resume' }));
    await submitImport(
      user,
      ['# Second Person', 'second@example.com', '', '## SUMMARY', 'Second marker.'].join('\n'),
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Second Person');
    expect(screen.queryByText('Jordan Avery')).not.toBeInTheDocument();
    expect(screen.queryByText(/eight years of experience/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Second marker/).length).toBeGreaterThan(0);

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('Second Person');
      expect(raw).not.toContain('Jordan Avery');
    });
  });

  it('loads the current draft into the textarea on request', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Import resume' }));
    await user.click(screen.getByRole('button', { name: 'Load current draft' }));

    const textarea = screen.getByLabelText('Resume text') as HTMLTextAreaElement;
    expect(textarea.value).toContain('# Jordan Avery');
  });
});

describe('editing, formatting, and persistence', () => {
  it('updates the preview as the name is edited', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Ada Lovelace');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('hides a section when it is disabled', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    const preview = screen.getByLabelText('Resume preview');
    expect(within(preview).getByText(/Bookbinding/)).toBeInTheDocument();

    const interests = screen.getByRole('region', { name: 'INTERESTS' });
    await user.click(within(interests).getByRole('checkbox'));

    expect(within(preview).queryByText(/Bookbinding/)).not.toBeInTheDocument();
  });

  it('adds a custom section', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    await user.selectOptions(screen.getByLabelText('Section type to add'), 'custom');
    await user.click(screen.getByRole('button', { name: 'Add section' }));
    expect(screen.getByDisplayValue('NEW SECTION')).toBeInTheDocument();
  });

  it('persists edits to localStorage', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Persisted Person');

    await waitFor(
      () => {
        const raw = localStorage.getItem(DRAFT_KEY) ?? '';
        expect(raw).toContain('Persisted Person');
      },
      { timeout: 2000 },
    );
  });

  it('shows page size and page count, and switches page size', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();
    const preview = screen.getByLabelText('Resume preview');
    expect(preview).toHaveTextContent('US Letter');

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('button', { name: 'Formatting' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await user.selectOptions(screen.getByLabelText('Page size'), 'a4');
    expect(preview).toHaveTextContent('A4');
  });

  it('persists formatting across reloads', async () => {
    const user = userEvent.setup();
    seedDraft();
    const { unmount } = renderApp();

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.selectOptions(screen.getByLabelText('Page size'), 'a4');
    await user.selectOptions(screen.getByLabelText('Content density'), 'spacious');

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('"pageSize":"a4"');
      expect(raw).toContain('"density":"spacious"');
    });

    unmount();
    renderApp();
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByLabelText('Page size')).toHaveValue('a4');
    expect(screen.getByLabelText('Content density')).toHaveValue('spacious');
  });
});

describe('header, theme, and footer', () => {
  it('renders the document actions with accessible names', () => {
    seedDraft();
    renderApp();

    expect(screen.getByRole('button', { name: 'New resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import resume' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Formatting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export Word document' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument();
  });

  it('defaults to light, toggles, and persists the choice', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: /switch to light mode/i }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('restores a stored theme', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    renderApp();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('follows the system preference when nothing is stored', () => {
    mockSystemTheme(true);
    renderApp();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('keeps the resume document colors fixed in dark mode', async () => {
    const user = userEvent.setup();
    seedDraft();
    renderApp();
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
    expect(footer).toHaveTextContent('OpenResume');
    expect(footer).toHaveTextContent(`v${APP_VERSION}`);
    expect(footer).toHaveTextContent(/Kovina/);
    expect(within(footer).getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Input format' })).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'MIT license' })).toBeInTheDocument();
  });
});
