import { describe, expect, it } from 'vitest';
import {
  addBodyParagraph,
  removeBodyParagraph,
  resetLetterTemplate,
  updateApplicant,
  updateApplicantContact,
  updateBodyParagraph,
  updateLetter,
  updateLetterFormat,
  updateLetterTemplate,
  updateRecipientText,
} from '../src/lib/coverLetterEdits';
import { buildCoverLetterScaffold } from '../src/lib/coverLetterScaffold';
import { parseCoverLetter } from '../src/lib/parseCoverLetter';
import { createSampleCoverLetter } from '../src/lib/coverLetterSample';
import { createSampleResume } from '../src/lib/sample';

describe('coverLetterEdits', () => {
  it('updates identity and contact', () => {
    const letter = createSampleCoverLetter();
    const updated = updateApplicantContact(updateApplicant(letter, { name: 'New Person' }), {
      email: 'new@example.com',
    });
    expect(updated.applicant.name).toBe('New Person');
    expect(updated.applicant.contact.email).toBe('new@example.com');
    expect(letter.applicant.name).toBe('Jordan Avery');
  });

  it('adds, updates, and removes body paragraphs while keeping one', () => {
    const letter = { ...createSampleCoverLetter(), body: ['Only paragraph.'] };
    const added = addBodyParagraph(letter);
    expect(added.body).toHaveLength(2);

    const updated = updateBodyParagraph(added, 1, 'Second paragraph.');
    expect(updated.body[1]).toBe('Second paragraph.');

    expect(removeBodyParagraph(updated, 0).body).toEqual(['Second paragraph.']);
    expect(removeBodyParagraph({ ...letter, body: ['Only.'] }, 0).body).toEqual(['Only.']);
  });

  it('stores recipient edits as lines', () => {
    const letter = updateRecipientText(createSampleCoverLetter(), 'A\n\nB');
    expect(letter.recipient).toEqual(['A', '', 'B']);
  });

  it('updates and resets the letter template', () => {
    const letter = updateLetterFormat(
      updateLetterTemplate(createSampleCoverLetter(), { pageSize: 'legal' }),
      { paragraphSpacing: 'relaxed' },
    );
    expect(letter.template.pageSize).toBe('legal');
    expect(letter.template.format.paragraphSpacing).toBe('relaxed');

    const reset = resetLetterTemplate(letter);
    expect(reset.template.pageSize).toBe('letter');
    expect(reset.template.format.paragraphSpacing).toBe('standard');
  });

  it('supports a generic letter patch', () => {
    const letter = updateLetter(createSampleCoverLetter(), { position: 'Staff Engineer' });
    expect(letter.position).toBe('Staff Engineer');
  });
});

describe('buildCoverLetterScaffold', () => {
  it('reuses identity and contact without generating letter content', () => {
    const resume = createSampleResume();
    const scaffold = buildCoverLetterScaffold(resume);
    const parsed = parseCoverLetter(scaffold).coverLetter;

    expect(scaffold).toContain('# Jordan Avery');
    expect(scaffold).toContain('jordan.avery@example.com');
    expect(scaffold).toContain('## BODY');
    expect(scaffold).not.toContain('I am writing');
    expect(parsed.applicant.name).toBe('Jordan Avery');
    expect(parsed.applicant.contact.email).toBe('jordan.avery@example.com');
    expect(parsed.body).toEqual([]);
    expect(parsed.signature).toBe('Jordan Avery');
  });
});
