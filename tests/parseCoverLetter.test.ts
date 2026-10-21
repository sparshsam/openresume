import { describe, expect, it } from 'vitest';
import { parseCoverLetter } from '../src/lib/parseCoverLetter';
import { SAMPLE_COVER_LETTER_TEXT } from '../src/lib/coverLetterSample';

describe('parseCoverLetter', () => {
  it('parses a complete cover letter', () => {
    const { coverLetter, warnings, documentCount } = parseCoverLetter(SAMPLE_COVER_LETTER_TEXT);

    expect(documentCount).toBe(1);
    expect(warnings).toEqual([]);
    expect(coverLetter.applicant.name).toBe('Jordan Avery');
    expect(coverLetter.applicant.headline).toBe('Product-minded software generalist');
    expect(coverLetter.applicant.contact.email).toBe('jordan.avery@example.com');
    expect(coverLetter.applicant.contact.phone).toBe('+1 555 0142');
    expect(coverLetter.applicant.contact.location).toBe('Toronto, ON');
    expect(coverLetter.applicant.contact.links[0]?.label).toBe('linkedin.com/in/jordanavery');
    expect(coverLetter.date).toBe('October 18, 2026');
    expect(coverLetter.recipient).toEqual([
      'Morgan Lee',
      'Hiring Manager',
      'Brightline Labs',
      '123 Example Street',
      'Toronto, ON M5V 1A1',
    ]);
    expect(coverLetter.position).toBe('Senior Product Engineer');
    expect(coverLetter.salutation).toBe('Dear Ms. Lee,');
    expect(coverLetter.body).toHaveLength(3);
    expect(coverLetter.body[0]).toContain('I am writing to apply');
    expect(coverLetter.closing).toBe('Sincerely,');
    expect(coverLetter.signature).toBe('Jordan Avery');
  });

  it('supports a minimal letter with only a name and body', () => {
    const { coverLetter, warnings } = parseCoverLetter(
      ['# A Person', 'a@example.com', '', '## BODY', 'Only paragraph.'].join('\n'),
    );

    expect(coverLetter.applicant.name).toBe('A Person');
    expect(coverLetter.date).toBe('');
    expect(coverLetter.recipient).toEqual([]);
    expect(coverLetter.position).toBe('');
    expect(coverLetter.salutation).toBe('');
    expect(coverLetter.body).toEqual(['Only paragraph.']);
    expect(coverLetter.closing).toBe('');
    expect(coverLetter.signature).toBe('');
    expect(warnings).toEqual([]);
  });

  it('keeps multiple paragraphs separated by blank lines', () => {
    const { coverLetter } = parseCoverLetter(
      [
        '# A Person',
        '',
        '## BODY',
        'First paragraph.',
        'Still first.',
        '',
        'Second paragraph.',
      ].join('\n'),
    );
    expect(coverLetter.body).toEqual(['First paragraph. Still first.', 'Second paragraph.']);
  });

  it('accepts section aliases', () => {
    const { coverLetter } = parseCoverLetter(
      [
        '# A Person',
        '',
        '## GREETING',
        'Hello,',
        '',
        '## SUBJECT',
        'Product role',
        '',
        '## LETTER',
        'Body.',
        '',
        '## SIGN-OFF',
        'Best,',
      ].join('\n'),
    );
    expect(coverLetter.salutation).toBe('Hello,');
    expect(coverLetter.position).toBe('Product role');
    expect(coverLetter.body).toEqual(['Body.']);
    expect(coverLetter.closing).toBe('Best,');
  });

  it('preserves unknown sections in the body with a warning', () => {
    const { coverLetter, warnings } = parseCoverLetter(
      ['# A Person', '', '## BODY', 'Body.', '', '## REFERENCES', 'Available on request.'].join(
        '\n',
      ),
    );

    expect(coverLetter.body).toContain('Available on request.');
    expect(warnings.some((warning) => warning.includes('REFERENCES'))).toBe(true);
  });

  it('detects concatenated letters', () => {
    const { documentCount, warnings } = parseCoverLetter(
      [
        '# First Person',
        '',
        '## BODY',
        'First.',
        '',
        '# Second Person',
        '',
        '## BODY',
        'Second.',
      ].join('\n'),
    );
    expect(documentCount).toBe(2);
    expect(warnings.some((warning) => warning.includes('additional cover letter heading'))).toBe(
      true,
    );
  });

  it('returns warnings for empty input and a missing body', () => {
    expect(parseCoverLetter('').warnings.length).toBeGreaterThan(0);
    const { warnings } = parseCoverLetter('# A Person\n\n## DATE\nOctober 18, 2026');
    expect(warnings.some((warning) => warning.includes('BODY'))).toBe(true);
  });

  it('parses fenced structured text identically to unfenced text', () => {
    const fenced = `\`\`\`\n${SAMPLE_COVER_LETTER_TEXT}\n\`\`\``;
    const direct = parseCoverLetter(SAMPLE_COVER_LETTER_TEXT);
    const wrapped = parseCoverLetter(fenced);
    expect(wrapped.coverLetter).toEqual(direct.coverLetter);
    expect(wrapped.documentCount).toBe(1);
    expect(wrapped.warnings).toEqual([]);
  });

  it('does not strip a fence that is surrounded by prose', () => {
    const input = `Here is your letter:\n\`\`\`text\n${SAMPLE_COVER_LETTER_TEXT}\n\`\`\``;
    const { coverLetter, warnings } = parseCoverLetter(input);
    expect(coverLetter.applicant.name).toBe('Jordan Avery');
    expect(coverLetter.body[0]).toContain('Here is your letter:');
    expect(warnings.some((warning) => warning.includes('before the first'))).toBe(true);
  });

  it('preserves punctuation and capitalization', () => {
    const { coverLetter } = parseCoverLetter(
      ['# Ada Lovelace', '', '## BODY', 'I build things — carefully, with Two  spaces.'].join('\n'),
    );
    expect(coverLetter.body[0]).toBe('I build things — carefully, with Two  spaces.');
  });
});
