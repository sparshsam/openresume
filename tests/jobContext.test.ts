import { describe, expect, it } from 'vitest';
import {
  JOB_CONTEXT_LIMITS,
  JOB_CONTEXT_VERSION,
  isGuidedPreparePath,
  parseJobContext,
} from '../src/lib/jobContext';

function search(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

describe('parseJobContext', () => {
  it('reads the complete version 1 contract', () => {
    const { job, warnings, hasContext } = parseJobContext(
      `?${search({
        contract: '1',
        job_id: 'job-42',
        job_title: 'Senior Product Engineer',
        employer: 'Brightline Labs',
        location: 'Toronto, ON',
        jd_url: 'https://jobs.example.com/42',
        apply_url: 'https://apply.example.com/42',
        details: 'Build calm document tools.',
        qualifications: 'Five years of product engineering.',
      })}`,
    );

    expect(warnings).toEqual([]);
    expect(hasContext).toBe(true);
    expect(job).toMatchObject({
      version: JOB_CONTEXT_VERSION,
      id: 'job-42',
      title: 'Senior Product Engineer',
      employer: 'Brightline Labs',
      location: 'Toronto, ON',
      jobDescriptionUrl: 'https://jobs.example.com/42',
      applicationUrl: 'https://apply.example.com/42',
      details: 'Build calm document tools.',
      qualifications: 'Five years of product engineering.',
    });
  });

  it('defaults the contract version and reports a version mismatch', () => {
    expect(parseJobContext('').job.version).toBe(JOB_CONTEXT_VERSION);
    const older = parseJobContext(`?${search({ job_title: 'Designer' })}`);
    expect(older.warnings).toEqual([]);
    expect(older.job.title).toBe('Designer');

    const future = parseJobContext(`?${search({ contract: '2', job_title: 'Designer' })}`);
    expect(future.job.version).toBe(JOB_CONTEXT_VERSION);
    expect(future.job.title).toBe('Designer');
    expect(future.warnings.some((warning) => warning.includes('contract version'))).toBe(true);

    const invalid = parseJobContext(`?${search({ contract: 'next', job_title: 'Designer' })}`);
    expect(invalid.warnings.some((warning) => warning.includes('contract version'))).toBe(true);
  });

  it('accepts only the exact supported contract version', () => {
    const malformed = parseJobContext(`?${search({ contract: '1x', job_title: 'Designer' })}`);
    expect(malformed.warnings.some((warning) => warning.includes('contract version'))).toBe(true);

    const long = parseJobContext(`?${search({ contract: '9'.repeat(40), job_title: 'Designer' })}`);
    const warning = long.warnings.find((entry) => entry.includes('contract version')) ?? '';
    expect(warning).toContain('9999');
    expect(warning.length).toBeLessThan(160);
  });

  it('strips bidirectional and zero-width format characters', () => {
    const { job } = parseJobContext(
      `?${search({ job_title: 'Back\u202eEngineer\u200b', employer: 'Acme\ufeff' })}`,
    );
    expect(job.title).toBe('BackEngineer');
    expect(job.employer).toBe('Acme');
  });

  it('works without context', () => {
    const result = parseJobContext('');
    expect(result.hasContext).toBe(false);
    expect(result.warnings).toEqual([]);
    expect(result.job).toEqual({ version: JOB_CONTEXT_VERSION });
  });

  it('keeps the job-description and application URLs distinct', () => {
    const { job, warnings } = parseJobContext(
      `?${search({
        jd_url: 'https://jobs.example.com/description',
        apply_url: 'https://jobs.example.com/apply',
      })}`,
    );
    expect(job.jobDescriptionUrl).toBe('https://jobs.example.com/description');
    expect(job.applicationUrl).toBe('https://jobs.example.com/apply');
    expect(warnings).toEqual([]);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<h1>no</h1>',
    'file:///etc/passwd',
    'http://jobs.example.com/42',
    'https://user:password@jobs.example.com/42',
    'not a url',
  ])('rejects the unsafe or malformed URL %s', (value) => {
    const { job, warnings } = parseJobContext(`?${search({ jd_url: value, apply_url: value })}`);
    expect(job.jobDescriptionUrl).toBeUndefined();
    expect(job.applicationUrl).toBeUndefined();
    expect(warnings.some((warning) => warning.includes('job-description URL'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('application URL'))).toBe(true);
  });

  it('enforces short, text, and URL size limits', () => {
    const longTitle = 'T'.repeat(JOB_CONTEXT_LIMITS.short + 40);
    const longDetails = 'D'.repeat(JOB_CONTEXT_LIMITS.text + 100);
    const longUrl = `https://jobs.example.com/${'a'.repeat(JOB_CONTEXT_LIMITS.url)}`;
    const { job, warnings } = parseJobContext(
      `?${search({
        job_title: longTitle,
        details: longDetails,
        jd_url: longUrl,
      })}`,
    );

    expect(job.title).toHaveLength(JOB_CONTEXT_LIMITS.short);
    expect(job.details).toHaveLength(JOB_CONTEXT_LIMITS.text);
    expect(job.jobDescriptionUrl).toBeUndefined();
    expect(warnings.some((warning) => warning.includes('Job title'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('details'))).toBe(true);
    expect(warnings.some((warning) => warning.includes('longer than'))).toBe(true);
  });

  it('cleans whitespace and control characters', () => {
    const { job } = parseJobContext(
      `?${search({
        job_title: '  Senior   Product\nEngineer  ',
        details: 'Line one\u0000\r\n\r\nLine two',
      })}`,
    );
    expect(job.title).toBe('Senior Product Engineer');
    expect(job.details).toBe('Line one\n\nLine two');
  });

  it('ignores unknown parameters and empty values', () => {
    const { job, hasContext } = parseJobContext(
      `?${search({ surprise: 'value', job_title: '   ', employer: '' })}`,
    );
    expect(hasContext).toBe(false);
    expect(job).toEqual({ version: JOB_CONTEXT_VERSION });
  });

  it('detects the guided prepare route', () => {
    expect(isGuidedPreparePath('/prepare')).toBe(true);
    expect(isGuidedPreparePath('/prepare/')).toBe(true);
    expect(isGuidedPreparePath('/prepare.html')).toBe(true);
    expect(isGuidedPreparePath('/')).toBe(false);
    expect(isGuidedPreparePath('/about')).toBe(false);
  });
});
