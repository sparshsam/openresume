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
    expect(textarea).toHaveValue('');
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

  it('replaces the whole document on a second import', async () => {
    const user = userEvent.setup();
    render(<App />);

    const importResume = async (text: string) => {
      await user.click(screen.getByRole('button', { name: 'Import text' }));
      const dialog = screen.getByRole('dialog');
      fireEvent.change(within(dialog).getByLabelText('Structured resume text'), {
        target: { value: text },
      });
      await user.click(within(dialog).getByRole('button', { name: 'Parse and replace' }));
    };

    await importResume(
      ['# First Person', 'first@example.com', '', '## SUMMARY', 'First marker.'].join('\n'),
    );
    expect(screen.getByLabelText('Name')).toHaveValue('First Person');

    await importResume(
      ['# Second Person', 'second@example.com', '', '## SUMMARY', 'Second marker.'].join('\n'),
    );

    expect(screen.getByLabelText('Name')).toHaveValue('Second Person');
    expect(screen.queryByText('First Person')).not.toBeInTheDocument();
    expect(screen.queryByText(/First marker/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Second marker/).length).toBeGreaterThan(0);

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('Second Person');
      expect(raw).not.toContain('First Person');
    });
  });

  it('rejects concatenated resumes without changing the document', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Import text' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Structured resume text'), {
      target: {
        value: [
          '# First Person',
          'first@example.com',
          '',
          '## SUMMARY',
          'First.',
          '',
          '# Second Person',
          'second@example.com',
          '',
          '## SUMMARY',
          'Second.',
        ].join('\n'),
      },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Parse and replace' }));

    expect(screen.getByRole('alert')).toHaveTextContent(/2 resume headings/);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jordan Avery');
  });

  it('shows page size and page count, and switches page size', async () => {
    const user = userEvent.setup();
    render(<App />);
    const preview = screen.getByLabelText('Resume preview');
    expect(preview).toHaveTextContent('US Letter');
    expect(preview).toHaveTextContent('1 page');

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByRole('button', { name: 'Formatting' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByLabelText('Page size')).toHaveValue('letter');

    await user.selectOptions(screen.getByLabelText('Page size'), 'a4');
    expect(preview).toHaveTextContent('A4');

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('"pageSize":"a4"');
    });
  });

  it('changes typography and resets formatting to defaults', async () => {
    const user = userEvent.setup();
    render(<App />);
    const preview = screen.getByLabelText('Resume preview');
    const name = within(preview).getByText('Jordan Avery');
    const initialSize = Number.parseFloat((name as HTMLElement).style.fontSize);

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.selectOptions(screen.getByLabelText('Font size'), 'large');
    await user.selectOptions(screen.getByLabelText('Page size'), 'legal');

    const enlarged = Number.parseFloat((name as HTMLElement).style.fontSize);
    expect(enlarged).toBeGreaterThan(initialSize);
    expect(preview).toHaveTextContent('US Legal');

    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(screen.getByLabelText('Page size')).toHaveValue('letter');
    expect(screen.getByLabelText('Font size')).toHaveValue('standard');
    expect(preview).toHaveTextContent('US Letter');
  });

  it('persists formatting across reloads and imports', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    await user.selectOptions(screen.getByLabelText('Page size'), 'a4');
    await user.selectOptions(screen.getByLabelText('Content density'), 'spacious');

    await waitFor(() => {
      const raw = localStorage.getItem(DRAFT_KEY) ?? '';
      expect(raw).toContain('"pageSize":"a4"');
      expect(raw).toContain('"density":"spacious"');
    });

    unmount();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Formatting' }));
    expect(screen.getByLabelText('Page size')).toHaveValue('a4');
    expect(screen.getByLabelText('Content density')).toHaveValue('spacious');

    await user.click(screen.getByRole('button', { name: 'Import text' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Structured resume text'), {
      target: { value: '# Imported Person\nimported@example.com\n\n## SUMMARY\nFresh.' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Parse and replace' }));

    expect(screen.getByLabelText('Page size')).toHaveValue('a4');
    expect(screen.getByLabelText('Content density')).toHaveValue('spacious');
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
