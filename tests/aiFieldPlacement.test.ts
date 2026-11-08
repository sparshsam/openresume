import { describe, expect, it } from 'vitest';
import { COVER_LETTER_DELIMITER, RESUME_DELIMITER } from '../src/lib/applicationKitFormat';
import {
  AI_CONTACT_LINE_EXAMPLES,
  APPLICATION_KIT_AI_INSTRUCTIONS,
  COVER_LETTER_AI_INSTRUCTIONS,
  RESUME_AI_INSTRUCTIONS,
  getAiInstructions,
} from '../src/lib/aiInstructions';
import { parseApplicationKit } from '../src/lib/parseApplicationKit';
import { parseCoverLetter } from '../src/lib/parseCoverLetter';
import { parseContactLine } from '../src/lib/contact';
import { parseResume } from '../src/lib/parse';

/**
 * These fixtures reproduce the shapes ChatGPT produces when it loses a
 * contact field: the headline is missing, the location is missing, the
 * phone is missing, or a target title is repeated in the final slot.
 */
const MALFORMED_RESUME = `# Jordan Avery
jordan.avery@example.com | +1 555 0142 | Senior Product Engineer | Toronto, ON | linkedin.com/in/jordanavery | github.com/jordanavery

## SUMMARY
Product engineer focused on calm, reliable document tools.

## EXPERIENCE
### Brightline Labs — Senior Product Engineer
2022 – Present | Senior Product Engineer
- Rebuilt a document workflow used by 12,000 people.
- Reduced time-to-first-draft from nine minutes to under two.

## EDUCATION
### Example University — B.Sc. Computer Science
2014 – 2018 | Toronto, ON`;

const MALFORMED_COVER_LETTER = `# Jordan Avery
jordan.avery@example.com | +1 555 0142 | Senior Product Engineer

## POSITION
Senior Product Engineer

## SALUTATION
Dear Hiring Manager,

## BODY
I am writing to apply for the Senior Product Engineer role.

I led the rebuild of a document workflow used by 12,000 people.

## CLOSING
Sincerely,

## SIGNATURE
Jordan Avery`;

describe('AI contact-line examples', () => {
  it('parse every published example with the intended placement', () => {
    const placements = AI_CONTACT_LINE_EXAMPLES.map((line) => parseContactLine(line));

    expect(placements[0]).toMatchObject({
      headline: 'Product-minded software generalist',
      contact: {
        email: 'jordan.avery@example.com',
        phone: '+1 555 0142',
        location: 'Toronto, ON',
      },
    });
    expect(placements[1].headline).toBeUndefined();
    expect(placements[1].contact.location).toBe('Toronto, ON');
    expect(placements[2].headline).toBe('Product-minded software generalist');
    expect(placements[2].contact.location).toBeUndefined();
    expect(placements[3].contact.location).toBeUndefined();
    expect(placements[3].contact.links).toHaveLength(2);
    expect(placements[4].contact.location).toBe('Remote (Canada)');
    expect(placements[4].contact.links).toHaveLength(2);

    for (const placement of placements) {
      expect(placement.contact.location ?? '').not.toMatch(/engineer|generalist|manager/i);
    }
  });

  it('is reachable from every workflow', () => {
    for (const kind of ['resume', 'coverLetter', 'applicationKit'] as const) {
      expect(getAiInstructions(kind)).toContain('Professional Headline | email | phone | Location');
      expect(getAiInstructions(kind)).toContain(AI_CONTACT_LINE_EXAMPLES[0]);
    }
  });
});

describe('malformed AI resume output', () => {
  it('moves a missing headline into the headline and keeps the real location', () => {
    const { resume, warnings } = parseResume(MALFORMED_RESUME);

    expect(resume.header.headline).toBe('Senior Product Engineer');
    expect(resume.contact.location).toBe('Toronto, ON');
    expect(warnings).not.toContain(
      'The final contact value looks like a job title or professional headline, so it was not used as a location.',
    );
  });

  it('rejects the repeated title in the entry metadata slot', () => {
    const { resume, warnings } = parseResume(MALFORMED_RESUME);
    const experience = resume.sections.find((section) => section.kind === 'experience');

    expect(experience?.items[0].dateRange).toBe('2022 – Present');
    expect(experience?.items[0].location).toBeUndefined();
    expect(warnings.some((warning) => warning.includes('job title'))).toBe(true);
  });

  it('keeps multiple links even when the phone or headline is missing', () => {
    const { resume } = parseResume(MALFORMED_RESUME);
    expect(resume.contact.links.map((link) => link.label)).toEqual([
      'linkedin.com/in/jordanavery',
      'github.com/jordanavery',
    ]);
  });
});

describe('malformed AI cover letter output', () => {
  it('keeps the target title out of the location field and leaves the location empty', () => {
    const { coverLetter, warnings } = parseCoverLetter(MALFORMED_COVER_LETTER);

    expect(coverLetter.position).toBe('Senior Product Engineer');
    expect(coverLetter.applicant.contact.location).toBeUndefined();
    expect(warnings.some((warning) => warning.includes('job title'))).toBe(true);
  });
});

describe('malformed AI application kit output', () => {
  it('applies the same placement rules to both documents', () => {
    const result = parseApplicationKit(
      `${RESUME_DELIMITER}\n${MALFORMED_RESUME}\n\n${COVER_LETTER_DELIMITER}\n${MALFORMED_COVER_LETTER}`,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resume.contact.location).toBe('Toronto, ON');
    expect(result.coverLetter.applicant.contact.location).toBeUndefined();
    expect(result.warnings.some((warning) => warning.includes('job title'))).toBe(true);
  });
});

describe('instruction contract', () => {
  it('tells every workflow that an absent location must stay absent', () => {
    for (const instructions of [
      RESUME_AI_INSTRUCTIONS,
      COVER_LETTER_AI_INSTRUCTIONS,
      APPLICATION_KIT_AI_INSTRUCTIONS,
    ]) {
      expect(instructions).toMatch(/write no location part at all/i);
      expect(instructions).toMatch(/Never infer a location/i);
    }
  });
});
