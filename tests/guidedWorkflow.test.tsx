import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { APPLICATION_KIT_SAMPLE_TEXT } from '../src/lib/applicationKitSample';
import { SAMPLE_RESUME_TEXT, createSampleResume } from '../src/lib/sample';
import { createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { COVER_LETTER_DRAFT_KEY, DRAFT_KEY } from '../src/lib/storage';

type User = ReturnType<typeof userEvent.setup>;

const writeText = vi.fn();

function installClipboard(resolve = true) {
  writeText.mockReset();
  if (resolve) writeText.mockResolvedValue(undefined);
  else writeText.mockRejectedValue(new Error('Clipboard unavailable'));
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

function renderGuided(search = '') {
  installClipboard(true);
  window.history.replaceState({}, '', `/prepare${search}`);
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

function jobSearch(overrides: Record<string, string> = {}): string {
  return `?${new URLSearchParams({
    contract: '1',
    job_id: 'job-42',
    job_title: 'Senior Product Engineer',
    employer: 'Brightline Labs',
    location: 'Toronto, ON',
    jd_url: 'https://jobs.example.com/description/42',
    apply_url: 'https://jobs.example.com/apply/42',
    ...overrides,
  }).toString()}`;
}

async function chooseAssistant(user: User, name = 'ChatGPT') {
  await user.click(screen.getByRole('radio', { name }));
  await user.click(screen.getByRole('checkbox', { name: /I have opened my AI assistant/ }));
}

async function toPrepareStep(user: User) {
  await chooseAssistant(user);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(
    screen.getByRole('heading', { level: 1, name: 'Prepare tailored content' }),
  ).toBeInTheDocument();
}

async function toBuildStep(user: User) {
  await toPrepareStep(user);
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  expect(
    screen.getByRole('heading', { level: 1, name: 'Build your documents' }),
  ).toBeInTheDocument();
}

beforeEach(() => {
  localStorage.clear();
  installClipboard(true);
  window.history.replaceState({}, '', '/');
});

describe('guided prepare route', () => {
  it('works directly without Job Directory context', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Choose an AI assistant' }),
    ).toBeInTheDocument();
    const progress = screen.getByRole('navigation', { name: 'Application progress' });
    expect(within(progress).getAllByRole('listitem')).toHaveLength(5);
    expect(within(progress).getByText('Assistant').closest('li')).toHaveAttribute(
      'aria-current',
      'step',
    );

    expect(screen.getByText('Your job')).toBeInTheDocument();
    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Job title')).toHaveValue('');
    expect(screen.getByLabelText('Job-description URL (https)')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    for (const name of ['ChatGPT', 'Claude', 'Gemini']) {
      const link = screen.getByRole('link', { name: `Open ${name}` });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getByRole('radio', { name: 'ChatGPT' })).not.toBeChecked();
    expect(user).toBeTruthy();
  });

  it('shows validated Job Directory context and gates Continue on confirmation', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());

    expect(screen.getByText('Senior Product Engineer')).toBeInTheDocument();
    expect(screen.getByText('Brightline Labs')).toBeInTheDocument();
    expect(screen.getByText('Toronto, ON')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the job description' })).toHaveAttribute(
      'href',
      'https://jobs.example.com/description/42',
    );
    expect(
      screen.getByRole('link', { name: 'Open the employer application page' }),
    ).toHaveAttribute('href', 'https://jobs.example.com/apply/42');
    expect(screen.queryByLabelText('Job title')).not.toBeInTheDocument();
    const editButton = screen.getByRole('button', { name: 'Edit job details' });
    expect(editButton).not.toHaveAttribute('aria-controls');

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Claude' }));
    expect(continueButton).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /I have opened my AI assistant/ }));
    expect(continueButton).toBeEnabled();

    await user.click(editButton);
    expect(editButton).toHaveAttribute('aria-controls', 'guided-job-form');
    expect(screen.getByLabelText('Job title')).toHaveValue('Senior Product Engineer');
    expect(screen.getByLabelText('Job-description URL (https)')).toHaveValue(
      'https://jobs.example.com/description/42',
    );
  });

  it('rejects an invalid manual job URL before continuing', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided();

    fireEvent.change(screen.getByLabelText('Job title'), {
      target: { value: 'Designer' },
    });
    fireEvent.change(screen.getByLabelText('Job-description URL (https)'), {
      target: { value: 'http://jobs.example.com/42' },
    });
    await chooseAssistant(user);

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(
      screen.getAllByRole('alert').some((alert) => alert.textContent?.includes('https://')),
    ).toBe(true);
  });

  it('clears stale job-context warnings after an edit', () => {
    renderGuided(`?jd_url=${encodeURIComponent('javascript:alert(1)')}`);
    expect(
      screen.getByText(/was ignored because it is not a safe https address/),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Job title'), {
      target: { value: 'Designer' },
    });
    expect(
      screen.queryByText(/was ignored because it is not a safe https address/),
    ).not.toBeInTheDocument();
  });

  it('handles an unsupported contract version and unsafe URLs gracefully', () => {
    renderGuided(
      `?contract=9&job_title=Designer&jd_url=${encodeURIComponent('javascript:alert(1)')}`,
    );

    expect(screen.getByText(/Unsupported job-context contract version/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Open the job description' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('copies a job-specific prompt and switches between résumé and kit output', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await toPrepareStep(user);

    const jobUrl = 'https://jobs.example.com/description/42';
    await user.click(screen.getByRole('button', { name: 'Copy AI tailoring prompt' }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain(jobUrl);
    expect(writeText.mock.calls[0][0]).toContain('REQUIRED INPUTS');
    expect(writeText.mock.calls[0][0]).toContain('Never invent');
    expect(writeText.mock.calls[0][0]).not.toContain('=== OPENRESUME: RESUME ===');
    expect(screen.getByText('Prompt copied.')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Résumé \+ cover letter/ }));
    await user.click(screen.getByRole('button', { name: 'Copy AI tailoring prompt' }));
    expect(writeText.mock.calls[1][0]).toContain('=== OPENRESUME: RESUME ===');
    expect(writeText.mock.calls[1][0]).toContain('=== OPENRESUME: COVER LETTER ===');
  });

  it('preserves pasted text across Back and Continue and recovers from malformed output', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await toBuildStep(user);

    const textarea = screen.getByLabelText('AI-generated content');
    fireEvent.change(textarea, { target: { value: 'not a structured résumé' } });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Start with a single "# Your Name" line/);
    expect(textarea).toHaveValue('not a structured résumé');

    await user.click(screen.getByRole('button', { name: '← Back' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Prepare tailored content' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('AI-generated content')).toHaveValue('not a structured résumé');

    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: SAMPLE_RESUME_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Review and download' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getByRole('button', { name: 'Download résumé as PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download résumé as Word' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Download résumé in both formats' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Resume preview')).toBeInTheDocument();
  });

  it('moves focus and the current-step marker when continuing', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await chooseAssistant(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByRole('heading', { level: 1, name: 'Prepare tailored content' }),
    ).toHaveFocus();
    const progress = screen.getByRole('navigation', { name: 'Application progress' });
    const items = within(progress).getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('normalizes blank job URLs and refuses unsafe links', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided();

    fireEvent.change(screen.getByLabelText('Job-description URL (https)'), {
      target: { value: '   ' },
    });
    expect(screen.getByLabelText('Job-description URL (https)')).toHaveValue('');
    await chooseAssistant(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Copy AI tailoring prompt' }));
    expect(writeText.mock.calls[0][0]).toContain('Job-description URL: Not provided');

    await user.click(screen.getByRole('button', { name: '← Back' }));
    fireEvent.change(screen.getByLabelText('Job-description URL (https)'), {
      target: { value: 'javascript:alert(1)' },
    });
    expect(screen.queryByRole('link', { name: 'Open the job description' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('keeps a previously built cover letter out of a résumé-only rebuild without deleting it', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await toPrepareStep(user);
    await user.click(screen.getByRole('radio', { name: /Résumé \+ cover letter/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: APPLICATION_KIT_SAMPLE_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));
    expect(screen.getByRole('tab', { name: 'Cover letter' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '← Back' }));
    await user.click(screen.getByRole('button', { name: '← Back' }));
    await user.click(screen.getByRole('radio', { name: /Résumé only/ }));
    expect(screen.getByText(/kept in this session/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: SAMPLE_RESUME_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));

    expect(screen.queryByRole('tab', { name: 'Cover letter' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to application →' }));
    expect(screen.queryByText(/Cover_Letter\.(pdf|docx)/)).not.toBeInTheDocument();
  });

  it('keeps a chosen template through a Back and rebuild', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await toBuildStep(user);
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: SAMPLE_RESUME_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));

    await user.click(screen.getByRole('button', { name: 'Format' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));
    await user.click(screen.getByRole('radio', { name: /ATS Simple\./ }));
    await user.click(screen.getByRole('button', { name: 'Close formatting panel' }));

    await user.click(screen.getByRole('button', { name: '← Back' }));
    await user.click(screen.getByRole('button', { name: 'Build documents' }));
    await user.click(screen.getByRole('button', { name: 'Format' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));
    expect(screen.getByRole('radio', { name: /ATS Simple\./ })).toBeChecked();
  });

  it('cleans legacy drafts on the guided route', async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(createSampleResume()));
    localStorage.setItem(COVER_LETTER_DRAFT_KEY, JSON.stringify(createSampleCoverLetter()));
    renderGuided();

    await waitFor(() => {
      expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
      expect(localStorage.getItem(COVER_LETTER_DRAFT_KEY)).toBeNull();
    });
  });

  it('builds a résumé-and-cover-letter kit and exposes both documents', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await toPrepareStep(user);
    await user.click(screen.getByRole('radio', { name: /Résumé \+ cover letter/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: APPLICATION_KIT_SAMPLE_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));

    const resumeTab = screen.getByRole('tab', { name: 'Résumé' });
    expect(resumeTab).toHaveAttribute('aria-selected', 'true');
    resumeTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Cover letter' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: 'Cover letter' }));
    expect(screen.getByRole('tab', { name: 'Cover letter' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(
      screen.getByRole('button', { name: 'Download cover letter as PDF' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue to application →' }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your documents are ready' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Jordan-Avery_Senior-Product-Engineer_Resume\.pdf/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Jordan-Avery_Senior-Product-Engineer_Cover_Letter\.docx/),
    ).toBeInTheDocument();
    const apply = screen.getByRole('link', { name: /Open the employer application page/ });
    expect(apply).toHaveAttribute('href', 'https://jobs.example.com/apply/42');
    expect(apply).toHaveAttribute('target', '_blank');
    expect(apply).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(/OpenResume does not submit applications/)).toBeInTheDocument();
  });

  it('handles a missing application URL without pretending to submit', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch({ apply_url: '' }));
    await toBuildStep(user);
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: SAMPLE_RESUME_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));
    await user.click(screen.getByRole('button', { name: 'Continue to application →' }));

    expect(screen.getByText(/The employer application link was not provided/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Open the employer application page/ }),
    ).not.toBeInTheDocument();
  });

  it('keeps applicant information out of the URL', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderGuided(jobSearch());
    await toBuildStep(user);
    fireEvent.change(screen.getByLabelText('AI-generated content'), {
      target: { value: SAMPLE_RESUME_TEXT },
    });
    await user.click(screen.getByRole('button', { name: 'Build documents' }));

    expect(window.location.pathname).toBe('/prepare');
    expect(window.location.search).not.toContain('Jordan');
    expect(window.location.search).not.toContain('jordan.avery@example.com');
  });

  it('still renders the default builder at the root route', () => {
    window.history.replaceState({}, '', '/');
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: /Your next application/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Application progress' }),
    ).not.toBeInTheDocument();
  });
});
