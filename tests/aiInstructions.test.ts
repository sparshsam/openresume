import { describe, expect, it } from 'vitest';
import {
  AI_CONTACT_LINE_EXAMPLES,
  AI_FIELD_DEFINITIONS,
  APPLICATION_KIT_AI_EXAMPLE,
  APPLICATION_KIT_AI_INSTRUCTIONS,
  COVER_LETTER_AI_EXAMPLE,
  COVER_LETTER_AI_INSTRUCTIONS,
  RESUME_AI_EXAMPLE,
  RESUME_AI_INSTRUCTIONS,
  getAiInstructions,
} from '../src/lib/aiInstructions';
import { APPLICATION_KIT_SAMPLE_TEXT } from '../src/lib/applicationKitSample';
import { parseContactLine } from '../src/lib/contact';
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

describe('identity field definitions', () => {
  const templates: [string, string][] = [
    ['resume', RESUME_AI_INSTRUCTIONS],
    ['cover letter', COVER_LETTER_AI_INSTRUCTIONS],
    ['application kit', APPLICATION_KIT_AI_INSTRUCTIONS],
  ];

  it('distinguishes professional headline, job title, employer, and location', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(/Professional headline:/);
    expect(AI_FIELD_DEFINITIONS).toMatch(/Job title:/);
    expect(AI_FIELD_DEFINITIONS).toMatch(/Employer name:/);
    expect(AI_FIELD_DEFINITIONS).toMatch(/Geographic location:/);
  });

  it.each(templates)('applies the same field definitions to the %s template', (_name, text) => {
    expect(text).toContain(AI_FIELD_DEFINITIONS);
  });

  it('forbids job titles and employers in location slots', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(
      /Never (?:put|place|write) a job title, employer(?: name)?, or (?:professional )?headline in a location slot/i,
    );
  });

  it('keeps geographic location slots limited to verified places or confirmed arrangements', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(/verified geographic location/i);
    expect(AI_FIELD_DEFINITIONS).toMatch(/Remote/);
    expect(AI_FIELD_DEFINITIONS).toMatch(/explicitly confirmed/i);
  });

  it('leaves an unverified location empty and shows the date-only form', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(/omit the location/i);
    expect(AI_FIELD_DEFINITIONS).toMatch(/2022 – Present/);
  });

  it('pins the contact-line order so a headline can never land in the location slot', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(/headline is always the first part/i);
    expect(AI_FIELD_DEFINITIONS).toMatch(/location is always the last part/i);
  });
});

describe('instruction examples keep locations geographic', () => {
  it('uses a headline that is distinct from the example job title', () => {
    const resume = parseResume(RESUME_AI_EXAMPLE).resume;
    expect(resume.header.headline).toBe('Product-minded software generalist');
    expect(resume.contact.location).toBe('Toronto, ON');
    expect(RESUME_AI_EXAMPLE).toContain('### Example Company — Senior Product Engineer');
  });

  it('never parses a job title or employer into a resume entry location', () => {
    const resume = parseResume(RESUME_AI_EXAMPLE).resume;
    for (const section of resume.sections) {
      for (const item of section.items) {
        if (!item.location) continue;
        expect(item.location).not.toBe(item.title);
        expect(item.location).not.toBe(item.subtitle);
      }
    }
  });

  it('demonstrates an omitted location with a date-only metadata line', () => {
    const resume = parseResume(RESUME_AI_EXAMPLE).resume;
    const education = resume.sections.find((section) => section.kind === 'education');
    expect(education?.items[0]?.dateRange).toBe('2014 – 2018');
    expect(education?.items[0]?.location).toBeUndefined();
  });

  it('keeps the cover letter headline and location in their own slots', () => {
    const letter = parseCoverLetter(COVER_LETTER_AI_EXAMPLE).coverLetter;
    expect(letter.applicant.headline).toBe('Product-minded software generalist');
    expect(letter.applicant.contact.location).toBe('Toronto, ON');
  });

  it('keeps every kit example location geographic or a confirmed arrangement', () => {
    const result = parseApplicationKit(APPLICATION_KIT_AI_EXAMPLE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const locations = result.resume.sections.flatMap((section) =>
      section.items.map((item) => item.location).filter((value): value is string => Boolean(value)),
    );
    expect(locations.length).toBeGreaterThan(0);
    for (const location of locations) {
      expect(location).toMatch(/^[A-Za-z .'-]+, [A-Z]{2}$|^Remote$|^Hybrid$|^On-site$|^Online$/);
    }
    expect(result.resume.contact.location).toBe('Toronto, ON');
    expect(result.resume.header.headline).toBe('Product-minded software generalist');
  });
});

describe('AI contact-line contract', () => {
  it('names every contact-field role explicitly', () => {
    for (const role of [
      'Professional headline',
      'Target job title',
      'Employment job title',
      'Employer name',
      'Geographic location',
    ]) {
      expect(AI_FIELD_DEFINITIONS).toContain(role);
    }
  });

  it('requires absent fields to be omitted instead of shifting other values', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(/OMIT THE PART ENTIRELY/i);
    expect(AI_FIELD_DEFINITIONS).toMatch(/Never leave an empty "\\|" slot/i);
    expect(AI_FIELD_DEFINITIONS).toMatch(/do not substitute a different value/i);
  });

  it('forbids titles, employers, and headlines in location slots', () => {
    expect(AI_FIELD_DEFINITIONS).toMatch(/never place these in a location slot/i);
    expect(AI_FIELD_DEFINITIONS).toContain('Senior Product Engineer');
    expect(AI_FIELD_DEFINITIONS).toContain('Professional headline');
    expect(AI_FIELD_DEFINITIONS).toMatch(/Never infer a location/i);
  });

  it('ships contact-line examples for missing headline, missing location, and multiple links', () => {
    expect(AI_CONTACT_LINE_EXAMPLES.length).toBeGreaterThanOrEqual(4);
    for (const line of AI_CONTACT_LINE_EXAMPLES) {
      expect(AI_FIELD_DEFINITIONS).toContain(line);
    }
    const parsed = AI_CONTACT_LINE_EXAMPLES.map((line) => parseContactLine(line));
    expect(parsed.some((entry) => entry.headline === undefined)).toBe(true);
    expect(parsed.some((entry) => entry.contact.location === undefined)).toBe(true);
    expect(parsed.some((entry) => entry.contact.links.length >= 2)).toBe(true);
    for (const entry of parsed) {
      expect(entry.contact.location).not.toBe('Senior Product Engineer');
    }
  });

  it('places the same canonical contract in all three templates', () => {
    for (const instructions of [
      RESUME_AI_INSTRUCTIONS,
      COVER_LETTER_AI_INSTRUCTIONS,
      APPLICATION_KIT_AI_INSTRUCTIONS,
    ]) {
      expect(instructions).toContain('Professional Headline | email | phone | Location | Link');
      expect(instructions).toContain(AI_FIELD_DEFINITIONS);
    }
  });

  it('distinguishes the target job title from the employment job title in both prose templates', () => {
    expect(RESUME_AI_INSTRUCTIONS).toMatch(/target job title never appears in the contact line/i);
    expect(COVER_LETTER_AI_INSTRUCTIONS).toMatch(
      /POSITION contains the target job title/i,
    );
    expect(APPLICATION_KIT_AI_INSTRUCTIONS).toMatch(/POSITION contains the target job title/i);
  });
});
