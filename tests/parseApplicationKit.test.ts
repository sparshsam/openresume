import { describe, expect, it } from 'vitest';
import {
  COVER_LETTER_DELIMITER,
  RESUME_DELIMITER,
} from '../src/lib/applicationKitFormat';
import { parseApplicationKit } from '../src/lib/parseApplicationKit';
import { SAMPLE_COVER_LETTER_TEXT } from '../src/lib/coverLetterSample';
import { SAMPLE_RESUME_TEXT } from '../src/lib/sample';

const COMBINED = `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n${SAMPLE_COVER_LETTER_TEXT}`;
const FENCED = `\`\`\`text\n${COMBINED}\n\`\`\``;

function expectFailure(input: string, fragment: string) {
  const result = parseApplicationKit(input);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.join(' ')).toContain(fragment);
}

describe('parseApplicationKit', () => {
  it('parses a valid combined document', () => {
    const result = parseApplicationKit(COMBINED);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.resume.header.name).toBe('Jordan Avery');
    expect(result.resume.sections.length).toBeGreaterThan(0);
    expect(result.coverLetter.applicant.name).toBe('Jordan Avery');
    expect(result.coverLetter.body.length).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
  });

  it('parses a valid fenced document identically', () => {
    const fenced = parseApplicationKit(FENCED);
    const raw = parseApplicationKit(COMBINED);
    expect(fenced.ok).toBe(true);
    expect(raw.ok).toBe(true);
    if (!fenced.ok || !raw.ok) return;
    expect(fenced.resume).toEqual(raw.resume);
    expect(fenced.coverLetter).toEqual(raw.coverLetter);
    expect(fenced.warnings).toEqual(raw.warnings);
  });

  it('rejects a missing resume delimiter', () => {
    expectFailure(COMBINED.replace(`${RESUME_DELIMITER}\n`, ''), RESUME_DELIMITER);
  });

  it('rejects a missing cover letter delimiter', () => {
    expectFailure(COMBINED.replace(`\n\n${COVER_LETTER_DELIMITER}`, ''), COVER_LETTER_DELIMITER);
  });

  it('rejects duplicate delimiters', () => {
    expectFailure(`${COMBINED}\n${RESUME_DELIMITER}\n# Again`, 'more than once');
  });

  it('rejects reversed document order', () => {
    const reversed = `${COVER_LETTER_DELIMITER}\n${SAMPLE_COVER_LETTER_TEXT}\n\n${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}`;
    expectFailure(reversed, 'wrong order');
  });

  it('rejects an empty resume section', () => {
    expectFailure(
      `${RESUME_DELIMITER}\n\n${COVER_LETTER_DELIMITER}\n${SAMPLE_COVER_LETTER_TEXT}`,
      'resume section is empty',
    );
  });

  it('rejects an empty cover letter section', () => {
    expectFailure(
      `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n`,
      'cover letter section is empty',
    );
  });

  it('rejects a missing resume applicant name', () => {
    const resume = SAMPLE_RESUME_TEXT.replace('# Jordan Avery\n', '');
    expectFailure(
      `${RESUME_DELIMITER}\n${resume}\n\n${COVER_LETTER_DELIMITER}\n${SAMPLE_COVER_LETTER_TEXT}`,
      'resume section needs the applicant name',
    );
  });

  it('rejects a missing cover letter applicant name', () => {
    const letter = SAMPLE_COVER_LETTER_TEXT.replace('# Jordan Avery\n', '');
    expectFailure(
      `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n${letter}`,
      'cover letter section needs the applicant name',
    );
  });

  it('rejects a cover letter without a body', () => {
    const letter = '# Jordan Avery\n\n## DATE\nOctober 18, 2026';
    expectFailure(
      `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n${letter}`,
      '## BODY',
    );
  });

  it('rejects more than one resume heading', () => {
    const resume = `${SAMPLE_RESUME_TEXT}\n# Second Person\nsecond@example.com`;
    expectFailure(
      `${RESUME_DELIMITER}\n${resume}\n\n${COVER_LETTER_DELIMITER}\n${SAMPLE_COVER_LETTER_TEXT}`,
      'more than one top-level',
    );
  });

  it('rejects a malformed enclosing fence', () => {
    expectFailure(`\`\`\`text\n${COMBINED}`, 'enclosing code fence');
  });

  it('rejects prose before the resume delimiter', () => {
    expectFailure(`Here is your application kit:\n${COMBINED}`, 'before the resume delimiter');
  });

  it('warns when the applicant names differ without rewriting them', () => {
    const letter = SAMPLE_COVER_LETTER_TEXT.replace('# Jordan Avery', '# Jordan A. Avery');
    const result = parseApplicationKit(
      `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n${letter}`,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resume.header.name).toBe('Jordan Avery');
    expect(result.coverLetter.applicant.name).toBe('Jordan A. Avery');
    expect(result.warnings.some((warning) => warning.includes('different applicant names'))).toBe(
      true,
    );
  });

  it('warns when contact details differ without rewriting them', () => {
    const letter = SAMPLE_COVER_LETTER_TEXT.replace(
      'jordan.avery@example.com',
      'jordan.other@example.com',
    );
    const result = parseApplicationKit(
      `${RESUME_DELIMITER}\n${SAMPLE_RESUME_TEXT}\n\n${COVER_LETTER_DELIMITER}\n${letter}`,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resume.contact.email).toBe('jordan.avery@example.com');
    expect(result.coverLetter.applicant.contact.email).toBe('jordan.other@example.com');
    expect(result.warnings.some((warning) => warning.includes('different email'))).toBe(true);
  });

  it('rejects blank input', () => {
    expectFailure('   \n\n', 'Paste the combined');
  });
});
