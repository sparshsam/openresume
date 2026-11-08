import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
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

async function build(
  user: ReturnType<typeof userEvent.setup>,
  kind: 'resume' | 'coverLetter' | 'applicationKit',
) {
  const label =
    kind === 'resume'
      ? 'Build Resume'
      : kind === 'coverLetter'
        ? 'Build Cover Letter'
        : 'Build Application Kit';
  const field =
    kind === 'resume'
      ? 'Resume text'
      : kind === 'coverLetter'
        ? 'Cover letter text'
        : 'Application kit text';
  const text =
    kind === 'resume'
      ? SAMPLE_RESUME_TEXT
      : kind === 'coverLetter'
        ? SAMPLE_COVER_LETTER_TEXT
        : APPLICATION_KIT_SAMPLE_TEXT;

  await user.click(screen.getAllByRole('button', { name: label })[0]);
  fireEvent.change(screen.getByLabelText(field), { target: { value: text } });
  await user.click(screen.getByRole('button', { name: label }));
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
});

describe('live page counts', () => {
  it('shows the current document page count and updates when the design changes', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');

    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('1 page')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));
    await user.click(screen.getByRole('radio', { name: /ATS Simple\./ }));

    expect(within(screen.getByRole('banner')).getByText('2 pages')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Professional Two-Column\./ }));
    expect(within(screen.getByRole('banner')).getByText('1 page')).toBeInTheDocument();
  });

  it('updates when a section is set to start on a new page', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));
    await user.click(screen.getByRole('radio', { name: /ATS Simple\./ }));

    const pageLabel = () =>
      screen.getByRole('banner').querySelector('.document-pages')?.textContent ?? '';
    expect(pageLabel()).toBe('2 pages');

    const experience = screen.getByRole('region', { name: 'EXPERIENCE' });
    const toggle = within(experience).getByLabelText('New page');
    await user.click(toggle);

    expect(toggle).toBeChecked();
    expect(Number(pageLabel().split(' ')[0])).toBeGreaterThan(2);

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(pageLabel()).toBe('2 pages');
  });

  it('shows the cover letter count independently', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'coverLetter');

    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('Cover Letter')).toBeInTheDocument();
    expect(within(banner).getByText('1 page')).toBeInTheDocument();
  });

  it('shows both kit counts and keeps them independent of the active tab', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'applicationKit');

    expect(screen.getByText('Resume: 1 page | Cover Letter: 1 page')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));
    await user.click(screen.getByRole('radio', { name: /ATS Simple\./ }));
    expect(screen.getByText('Resume: 2 pages | Cover Letter: 1 page')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Cover Letter' }));
    expect(screen.getByText('Resume: 2 pages | Cover Letter: 1 page')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Resume' }));
    expect(screen.getByText('Resume: 2 pages | Cover Letter: 1 page')).toBeInTheDocument();
  });
});
