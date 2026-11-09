import { describe, expect, it } from 'vitest';
import { buildGuidedPrompt } from '../src/lib/guidedPrompt';
import { AI_FIELD_DEFINITIONS } from '../src/lib/aiInstructions';
import type { JobContext } from '../src/lib/jobContext';

const JOB: JobContext = {
  version: 1,
  id: 'job-42',
  title: 'Senior Product Engineer',
  employer: 'Brightline Labs',
  location: 'Toronto, ON',
  jobDescriptionUrl: 'https://jobs.example.com/description/42',
  applicationUrl: 'https://jobs.example.com/apply/42',
  details: 'Build calm document tools for a small product team.',
  qualifications: 'Five years of product engineering and TypeScript.',
};

describe('guided prompt', () => {
  it('includes the complete target job and both distinct URLs', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toContain('Senior Product Engineer');
    expect(prompt).toContain('Brightline Labs');
    expect(prompt).toContain('Toronto, ON');
    expect(prompt).toContain('job-42');
    expect(prompt).toContain('https://jobs.example.com/description/42');
    expect(prompt).toContain('https://jobs.example.com/apply/42');
    expect(prompt).toContain('Build calm document tools');
    expect(prompt).toContain('Five years of product engineering');
  });

  it('requires the base résumé and complete job description before tailoring', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toMatch(/REQUIRED INPUTS/i);
    expect(prompt).toMatch(/existing résumé/i);
    expect(prompt).toMatch(/upload/i);
    expect(prompt).toMatch(/complete job description/i);
    expect(prompt).toMatch(/do not (?:begin|proceed)/i);
    expect(prompt).toMatch(/until you have both/i);
  });

  it('asks for pasted text or screenshots when the URL cannot be read', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toMatch(/cannot access the URL/i);
    expect(prompt).toMatch(/paste the full job description/i);
    expect(prompt).toMatch(/screenshots/i);
  });

  it('never allows the listing summary to replace the full description', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toMatch(/listing summary/i);
    expect(prompt).toMatch(/NOT a substitute for the complete job description/i);
    expect(prompt).toMatch(
      /do not use the brief Job Directory listing summary as the job description/i,
    );
  });

  it('forbids inventing applicant facts', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toMatch(/Never invent/i);
    expect(prompt).toMatch(/Preserve factual employment history/i);
    expect(prompt).toMatch(/dates, credentials, and achievements/i);
  });

  it('embeds the shared field-placement rules', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toContain(AI_FIELD_DEFINITIONS);
    expect(prompt).toContain('Professional Headline | email | phone | Location | Link');
    expect(prompt).toMatch(/target job title/i);
  });

  it('uses the resume output contract for a résumé-only request', () => {
    const prompt = buildGuidedPrompt(JOB, 'resume');

    expect(prompt).toContain('Return exactly ONE plain-text code block');
    expect(prompt).toContain('## EXPERIENCE');
    expect(prompt).not.toContain('=== OPENRESUME: RESUME ===');
    expect(prompt).toMatch(/résumé only/i);
  });

  it('uses the application-kit output contract for a coordinated request', () => {
    const prompt = buildGuidedPrompt(JOB, 'applicationKit');

    expect(prompt).toContain('=== OPENRESUME: RESUME ===');
    expect(prompt).toContain('=== OPENRESUME: COVER LETTER ===');
    expect(prompt).toMatch(/one résumé and one matching cover letter/i);
  });

  it('handles a missing job-description URL and missing summary', () => {
    const prompt = buildGuidedPrompt(
      { version: 1, title: 'Designer', employer: 'Example Co' },
      'resume',
    );

    expect(prompt).toMatch(/Job-description URL: Not provided/i);
    expect(prompt).toMatch(/No listing summary was provided/i);
    expect(prompt).toMatch(/ask the applicant/i);
  });
});
