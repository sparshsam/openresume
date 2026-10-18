import { describe, expect, it } from 'vitest';
import {
  COVER_LETTER_AI_EXAMPLE,
  COVER_LETTER_AI_INSTRUCTIONS,
  RESUME_AI_EXAMPLE,
  RESUME_AI_INSTRUCTIONS,
  getAiInstructions,
} from '../src/lib/aiInstructions';
import { COVER_LETTER_SECTION_ALIASES, parseCoverLetter } from '../src/lib/parseCoverLetter';
import { RESUME_SECTION_ALIASES, parseResume } from '../src/lib/parse';

describe('AI instructions', () => {
  it('mentions every resume section alias', () => {
    const instructions = RESUME_AI_INSTRUCTIONS.toUpperCase();
    for (const alias of Object.keys(RESUME_SECTION_ALIASES)) {
      expect(instructions).toContain(alias.toUpperCase());
    }
  });

  it('mentions every cover letter section alias', () => {
    const instructions = COVER_LETTER_AI_INSTRUCTIONS.toUpperCase();
    for (const alias of Object.keys(COVER_LETTER_SECTION_ALIASES)) {
      expect(instructions).toContain(alias.toUpperCase());
    }
  });

  it('includes the structural and factual rules', () => {
    expect(RESUME_AI_INSTRUCTIONS).toContain('Output only plain structured text');
    expect(RESUME_AI_INSTRUCTIONS).toContain('Never invent');
    expect(RESUME_AI_INSTRUCTIONS).toContain('## EXPERIENCE');
    expect(RESUME_AI_INSTRUCTIONS).toContain('### Company — Role');
    expect(RESUME_AI_INSTRUCTIONS).not.toContain('```');

    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('Output only plain structured text');
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('Never invent');
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('## BODY');
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('Separate paragraphs with a blank line');
    expect(COVER_LETTER_AI_INSTRUCTIONS).not.toContain('```');
  });

  it('ships examples that parse with the real parsers', () => {
    const resume = parseResume(RESUME_AI_EXAMPLE).resume;
    expect(resume.header.name).toBe('Jordan Avery');
    expect(resume.sections.length).toBeGreaterThan(0);

    const coverLetter = parseCoverLetter(COVER_LETTER_AI_EXAMPLE).coverLetter;
    expect(coverLetter.applicant.name).toBe('Jordan Avery');
    expect(coverLetter.body.length).toBeGreaterThan(0);
  });

  it('returns the template for the requested document kind', () => {
    expect(getAiInstructions('resume')).toBe(RESUME_AI_INSTRUCTIONS);
    expect(getAiInstructions('coverLetter')).toBe(COVER_LETTER_AI_INSTRUCTIONS);
  });
});
