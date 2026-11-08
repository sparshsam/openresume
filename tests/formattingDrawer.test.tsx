import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { COVER_LETTER_DELIMITER, RESUME_DELIMITER } from '../src/lib/applicationKitFormat';
import { SAMPLE_COVER_LETTER_TEXT } from '../src/lib/coverLetterSample';
import { SAMPLE_RESUME_TEXT } from '../src/lib/sample';

type User = ReturnType<typeof userEvent.setup>;

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

const KIT_TEXT = `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n${SAMPLE_COVER_LETTER_TEXT}`;

async function buildKit(user: User) {
  await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
  fireEvent.change(screen.getByLabelText('Application kit text'), {
    target: { value: KIT_TEXT },
  });
  await user.click(screen.getByRole('button', { name: 'Build Application Kit' }));
}

async function build(user: User, kind: 'resume' | 'coverLetter') {
  await user.click(
    screen.getByRole('button', {
      name: kind === 'resume' ? 'Build Resume' : 'Build Cover Letter',
    }),
  );
  fireEvent.change(screen.getByLabelText(kind === 'resume' ? 'Resume text' : 'Cover letter text'), {
    target: { value: kind === 'resume' ? SAMPLE_RESUME_TEXT : SAMPLE_COVER_LETTER_TEXT },
  });
  await user.click(
    screen.getByRole('button', {
      name: kind === 'resume' ? 'Build Resume' : 'Build Cover Letter',
    }),
  );
}

describe('format drawer', () => {
  it('opens a compact non-modal dialog beside the workspace', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    const dialog = screen.getByRole('dialog', { name: 'Format' });
    expect(dialog).toHaveAttribute('aria-modal', 'false');
    expect(dialog).toHaveClass('format-drawer');
    expect(dialog.closest('.workspace')).toBeNull();
    expect(document.querySelector('.format-backdrop')).toBeInTheDocument();
    expect(screen.getByLabelText('Resume preview')).toBeInTheDocument();
  });

  it('defaults to the Formatting tab and keeps controls grouped', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    expect(screen.getByRole('tab', { name: 'Formatting' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Designs' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByLabelText('Page size')).toBeInTheDocument();
    expect(screen.getByLabelText('Bullet spacing')).toBeInTheDocument();
    expect(screen.getByLabelText('Column spacing')).toBeInTheDocument();
    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Spacing')).toBeInTheDocument();
  });

  it('shows compact proportional thumbnails on the Designs tab', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));

    const gallery = screen.getByRole('radiogroup', { name: 'Browse Designs' });
    expect(gallery).toHaveClass('design-gallery--compact');
    expect(within(gallery).getAllByRole('radio')).toHaveLength(10);
    expect(gallery.querySelectorAll('.design-thumb')).toHaveLength(10);
    expect(gallery.querySelectorAll('.design-card-description')).toHaveLength(0);
    for (const card of gallery.querySelectorAll('.design-card')) {
      expect(card.getAttribute('title')?.length).toBeGreaterThan(10);
    }
  });

  it('switches tabs with the arrow keys', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    const formatTab = screen.getByRole('tab', { name: 'Formatting' });
    formatTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Designs' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Formatting' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('closes with Escape and restores focus to the Format button', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    const formatButton = screen.getByRole('button', { name: 'Formatting' });
    await user.click(formatButton);
    expect(screen.getByRole('dialog', { name: 'Format' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Format' })).not.toBeInTheDocument();
    expect(formatButton).toHaveFocus();
  });

  it('does not steal focus when a kit tab closes the drawer', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await buildKit(user);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    const coverTab = screen.getByRole('tab', { name: 'Cover Letter' });
    await user.click(coverTab);

    expect(screen.queryByRole('dialog', { name: 'Format' })).not.toBeInTheDocument();
    expect(coverTab).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Formatting' })).not.toHaveFocus();
  });

  it('announces the header action as close while the drawer is open', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    const closeAction = screen.getByRole('button', { name: 'Close formatting' });
    expect(closeAction).toHaveAttribute('aria-expanded', 'true');
    await user.click(closeAction);
    expect(screen.queryByRole('dialog', { name: 'Format' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Formatting' })).toBeInTheDocument();
  });

  it('closes with the close button', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'resume');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));

    await user.click(screen.getByRole('button', { name: 'Close formatting panel' }));
    expect(screen.queryByRole('dialog', { name: 'Format' })).not.toBeInTheDocument();
  });

  it('shows letter styles instead of resume designs for a cover letter', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderApp();
    await build(user, 'coverLetter');
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.click(screen.getByRole('tab', { name: 'Designs' }));

    expect(screen.queryByRole('radiogroup', { name: 'Browse Designs' })).not.toBeInTheDocument();
    const styles = screen.getByRole('radiogroup', { name: 'Letter style' });
    expect(within(styles).getAllByRole('radio')).toHaveLength(4);
    expect(styles).toHaveClass('design-gallery--compact');
  });
});
