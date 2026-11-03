import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { resetViewScroll } from '../src/lib/viewScroll';
import { SAMPLE_COVER_LETTER_TEXT } from '../src/lib/coverLetterSample';
import { SAMPLE_RESUME_TEXT } from '../src/lib/sample';
import { APPLICATION_KIT_SAMPLE_TEXT } from '../src/lib/applicationKitSample';

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

async function buildFromLanding(
  user: ReturnType<typeof userEvent.setup>,
  kind: 'resume' | 'coverLetter' | 'applicationKit',
  text: string,
) {
  const buildLabel =
    kind === 'resume'
      ? 'Build Resume'
      : kind === 'coverLetter'
        ? 'Build Cover Letter'
        : 'Build Application Kit';
  const textLabel =
    kind === 'resume'
      ? 'Resume text'
      : kind === 'coverLetter'
        ? 'Cover letter text'
        : 'Application kit text';

  await user.click(screen.getAllByRole('button', { name: buildLabel })[0]);
  fireEvent.change(screen.getByLabelText(textLabel), { target: { value: text } });
  await user.click(screen.getByRole('button', { name: buildLabel }));
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  vi.restoreAllMocks();
});

describe('workspace entry scroll position', () => {
  it.each([
    ['resume', SAMPLE_RESUME_TEXT],
    ['cover letter', SAMPLE_COVER_LETTER_TEXT],
    ['application kit', APPLICATION_KIT_SAMPLE_TEXT],
  ] as const)('opens the %s workspace at the top after building', async (kind, text) => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    document.documentElement.scrollTop = 1200;

    await buildFromLanding(
      user,
      kind === 'resume' ? 'resume' : kind === 'cover letter' ? 'coverLetter' : 'applicationKit',
      text,
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
  });

  it('disables browser scroll restoration while the app is mounted', () => {
    renderApp();

    expect(window.history.scrollRestoration).toBe('manual');
  });

  it('leaves normal scrolling alone after the workspace opens', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();

    await buildFromLanding(user, 'resume', SAMPLE_RESUME_TEXT);
    scrollTo.mockClear();

    await user.type(screen.getByLabelText('Name'), '!');

    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery!');
  });
});

describe('resetViewScroll', () => {
  it('resets the page and the workspace scroll containers', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const workspace = document.createElement('main');
    workspace.className = 'workspace';
    const editor = document.createElement('aside');
    editor.className = 'editor';
    editor.scrollTop = 480;
    const preview = document.createElement('div');
    preview.className = 'preview-region';
    preview.scrollTop = 640;
    workspace.append(editor, preview);
    document.body.append(workspace);
    document.documentElement.scrollTop = 900;

    resetViewScroll(workspace);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(editor.scrollTop).toBe(0);
    expect(preview.scrollTop).toBe(0);

    workspace.remove();
  });

  it('tolerates a missing workspace', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.documentElement.scrollTop = 300;

    resetViewScroll(null);

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
  });
});
