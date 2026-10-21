import { describe, expect, it } from 'vitest';
import {
  APPLICATION_KIT_AI_EXAMPLE,
  APPLICATION_KIT_AI_INSTRUCTIONS,
  COVER_LETTER_AI_EXAMPLE,
  COVER_LETTER_AI_INSTRUCTIONS,
  RESUME_AI_EXAMPLE,
  RESUME_AI_INSTRUCTIONS,
  getAiInstructions,
} from '../src/lib/aiInstructions';
import { APPLICATION_KIT_SAMPLE_TEXT } from '../src/lib/applicationKitSample';
import { parseApplicationKit } from '../src/lib/parseApplicationKit';
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

  it('requires one plain-text code block for resume output', () => {
    const instructions = RESUME_AI_INSTRUCTIONS;
    expect(instructions).toContain('Return exactly ONE plain-text code block');
    expect(instructions).toMatch(/delivery container/i);
    expect(instructions).toContain('The first character INSIDE the code block must be #');
    expect(instructions).toContain('Preserve the literal #, ##, and ### markers');
    expect(instructions).toMatch(/no explanatory text outside the code block/i);
    expect(instructions).toMatch(/no additional code blocks/i);
    expect(instructions).toMatch(/no tables or HTML/i);
    expect((instructions.match(/^```/gm) ?? []).length).toBe(2);
  });

  it('includes the resume structural and factual rules', () => {
    expect(RESUME_AI_INSTRUCTIONS).toContain('Never invent');
    expect(RESUME_AI_INSTRUCTIONS).toContain('## EXPERIENCE');
    expect(RESUME_AI_INSTRUCTIONS).toContain('### Employer Name — Job Title');
    expect(RESUME_AI_INSTRUCTIONS).toContain('Canadian English');
    expect(RESUME_AI_INSTRUCTIONS).toContain('ask a concise clarification question');
  });

  it('requires one plain-text code block for cover letter output', () => {
    const instructions = COVER_LETTER_AI_INSTRUCTIONS;
    expect(instructions).toContain('Return exactly ONE plain-text code block');
    expect(instructions).toMatch(/delivery container/i);
    expect(instructions).toContain('The first character INSIDE the code block must be #');
    expect(instructions).toContain('Preserve the literal #, ##, and ### markers');
    expect((instructions.match(/^```/gm) ?? []).length).toBe(2);
  });

  it('includes the cover letter structural and factual rules', () => {
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('## BODY');
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('Never invent');
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('Canadian English');
    expect(COVER_LETTER_AI_INSTRUCTIONS).toContain('natural paragraphs');
  });

  it('ships a kit example that parses with the real combined parser', () => {
    const result = parseApplicationKit(APPLICATION_KIT_AI_EXAMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.resume.header.name).toBe('Jordan Avery');
    expect(result.coverLetter.applicant.name).toBe('Jordan Avery');
    expect(result.coverLetter.body.length).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
  });

  it('ships examples that parse with the real parsers', () => {
    const resume = parseResume(RESUME_AI_EXAMPLE).resume;
    expect(resume.header.name).toBe('Jordan Avery');
    expect(resume.sections.length).toBeGreaterThan(0);

    const coverLetter = parseCoverLetter(COVER_LETTER_AI_EXAMPLE).coverLetter;
    expect(coverLetter.applicant.name).toBe('Jordan Avery');
    expect(coverLetter.body.length).toBeGreaterThan(0);
  });

  it('requires one plain-text code block for application kit output', () => {
    const instructions = APPLICATION_KIT_AI_INSTRUCTIONS;
    expect(instructions).toContain('Return exactly ONE plain-text code block');
    expect(instructions).toMatch(/delivery container/i);
    expect(instructions).toContain('Each document must begin with # ');
    expect(instructions).toContain('Preserve the literal #, ##, and ### markers');
    expect(instructions).toContain('=== OPENRESUME: RESUME ===');
    expect(instructions).toContain('=== OPENRESUME: COVER LETTER ===');
    expect(instructions.indexOf('=== OPENRESUME: RESUME ===')).toBeLessThan(
      instructions.indexOf('=== OPENRESUME: COVER LETTER ==='),
    );
    expect((instructions.match(/^```/gm) ?? []).length).toBe(2);
    expect(instructions).toContain('Canadian English');
    expect(instructions).toContain('ask a concise clarification question');
  });

  it('mentions every resume and cover letter alias in the kit template', () => {
    const instructions = APPLICATION_KIT_AI_INSTRUCTIONS.toUpperCase();
    for (const alias of Object.keys(RESUME_SECTION_ALIASES)) {
      expect(instructions).toContain(alias.toUpperCase());
    }
    for (const alias of Object.keys(COVER_LETTER_SECTION_ALIASES)) {
      expect(instructions).toContain(alias.toUpperCase());
    }
  });

  it('uses one canonical kit sample for instructions and Load Example', () => {
    expect(APPLICATION_KIT_AI_EXAMPLE).toContain(APPLICATION_KIT_SAMPLE_TEXT);
    expect(APPLICATION_KIT_AI_EXAMPLE.startsWith('```text\n')).toBe(true);
  });

  it('orders the kit example resume before the cover letter', () => {
    expect(APPLICATION_KIT_AI_EXAMPLE.indexOf('=== OPENRESUME: RESUME ===')).toBeLessThan(
      APPLICATION_KIT_AI_EXAMPLE.indexOf('=== OPENRESUME: COVER LETTER ==='),
    );
    expect((APPLICATION_KIT_AI_EXAMPLE.match(/^```/gm) ?? []).length).toBe(2);
  });

  it('returns the template for the requested document kind', () => {
    expect(getAiInstructions('resume')).toBe(RESUME_AI_INSTRUCTIONS);
    expect(getAiInstructions('coverLetter')).toBe(COVER_LETTER_AI_INSTRUCTIONS);
    expect(getAiInstructions('applicationKit')).toBe(APPLICATION_KIT_AI_INSTRUCTIONS);
  });
});
