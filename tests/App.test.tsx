import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { DRAFT_KEY } from '../src/lib/storage';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the sample resume in the editor and preview', () => {
    render(<App />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
    expect(screen.getByText('Jordan Avery')).toBeInTheDocument();
  });

  it('updates the preview as the name is edited', async () => {
    const user = userEvent.setup();
    render(<App />);
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Ada Lovelace');
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('hides a section when it is disabled', async () => {
    const user = userEvent.setup();
    render(<App />);
    const preview = screen.getByLabelText('Resume preview');
    expect(within(preview).getByText(/Bookbinding/)).toBeInTheDocument();

    const interests = screen.getByRole('region', { name: 'INTERESTS' });
    await user.click(within(interests).getByRole('checkbox'));

    expect(within(preview).queryByText(/Bookbinding/)).not.toBeInTheDocument();
  });

  it('imports structured text from the dialog', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Import text' }));

    const dialog = screen.getByRole('dialog');
    const textarea = within(dialog).getByLabelText('Structured resume text');
    fireEvent.change(textarea, {
      target: {
        value: [
          '# Imported Person',
          'Imported headline | imported@example.com',
          '',
          '## SUMMARY',
          'Hello.',
        ].join('\n'),
      },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Parse and replace' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Imported Person');
  });

  it('adds a custom section', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.selectOptions(screen.getByLabelText('Section type to add'), 'custom');
    await user.click(screen.getByRole('button', { name: 'Add section' }));
    expect(screen.getByDisplayValue('NEW SECTION')).toBeInTheDocument();
  });

  it('persists edits to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);
    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Persisted Person');

    await waitFor(
      () => {
        const raw = localStorage.getItem(DRAFT_KEY);
        expect(raw).toBeTruthy();
        expect(JSON.parse(raw as string).header.name).toBe('Persisted Person');
      },
      { timeout: 2000 },
    );
  });
});
