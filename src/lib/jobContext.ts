import { normalizePath } from './publicPages';

export const JOB_CONTEXT_VERSION = 1;

export const JOB_CONTEXT_LIMITS = {
  short: 200,
  text: 4000,
  url: 2048,
} as const;

export interface JobContext {
  /** The contract version understood by this parser. */
  version: number;
  id?: string;
  title?: string;
  employer?: string;
  location?: string;
  jobDescriptionUrl?: string;
  applicationUrl?: string;
  details?: string;
  qualifications?: string;
}

export interface JobContextResult {
  job: JobContext;
  warnings: string[];
  /** True when at least one job field was supplied. */
  hasContext: boolean;
}

const FORMAT_CHARACTERS = /[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g;

function cleanShort(value: string): string {
  return value.replace(FORMAT_CHARACTERS, '').replace(/\s+/g, ' ').trim();
}

function cleanText(value: string): string {
  return (
    value
      .replace(/\r\n?/g, '\n')
      // Keep tabs and newlines; drop other control characters.
      // Deliberately strip control characters from untrusted query values.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

function shortField(raw: string | null, label: string, warnings: string[]): string | undefined {
  if (raw === null) return undefined;
  const value = cleanShort(raw);
  if (!value) return undefined;
  if (value.length > JOB_CONTEXT_LIMITS.short) {
    warnings.push(`${label} was shortened to ${JOB_CONTEXT_LIMITS.short} characters.`);
    return value.slice(0, JOB_CONTEXT_LIMITS.short);
  }
  return value;
}

function textField(raw: string | null, label: string, warnings: string[]): string | undefined {
  if (raw === null) return undefined;
  const value = cleanText(raw);
  if (!value) return undefined;
  if (value.length > JOB_CONTEXT_LIMITS.text) {
    warnings.push(`${label} were shortened to ${JOB_CONTEXT_LIMITS.text} characters.`);
    return value.slice(0, JOB_CONTEXT_LIMITS.text);
  }
  return value;
}

function urlField(
  raw: string | null,
  label: 'job-description' | 'application',
  warnings: string[],
): string | undefined {
  if (raw === null) return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  const display = label === 'job-description' ? 'The job-description URL' : 'The application URL';
  if (value.length > JOB_CONTEXT_LIMITS.url) {
    warnings.push(
      `${display} was ignored because it is longer than ${JOB_CONTEXT_LIMITS.url} characters.`,
    );
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    warnings.push(`${display} was ignored because it is not a valid https address.`);
    return undefined;
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
    warnings.push(`${display} was ignored because it is not a safe https address.`);
    return undefined;
  }

  return parsed.toString();
}

/**
 * Reads the versioned Job Directory contract from a query string. Unknown
 * parameters are ignored, so later directory releases can add fields without
 * breaking this workflow. No applicant data is read from the URL.
 */
export function parseJobContext(search: string): JobContextResult {
  const params = new URLSearchParams(search);
  const warnings: string[] = [];

  const rawVersion = params.get('contract');
  if (rawVersion !== null) {
    const normalizedVersion = rawVersion.trim();
    if (normalizedVersion !== String(JOB_CONTEXT_VERSION)) {
      // Keep the echoed version bounded even if the query string is hostile.
      const shown = normalizedVersion.slice(0, 4) || '(empty)';
      warnings.push(
        `Unsupported job-context contract version "${shown}". Reading the version ${JOB_CONTEXT_VERSION} fields.`,
      );
    }
  }

  const job: JobContext = { version: JOB_CONTEXT_VERSION };
  const id = shortField(params.get('job_id'), 'Job ID', warnings);
  const title = shortField(params.get('job_title'), 'Job title', warnings);
  const employer = shortField(params.get('employer'), 'Employer', warnings);
  const location = shortField(params.get('location'), 'Location', warnings);
  const jobDescriptionUrl = urlField(params.get('jd_url'), 'job-description', warnings);
  const applicationUrl = urlField(params.get('apply_url'), 'application', warnings);
  const details = textField(params.get('details'), 'Job details', warnings);
  const qualifications = textField(params.get('qualifications'), 'Qualifications', warnings);

  if (id) job.id = id;
  if (title) job.title = title;
  if (employer) job.employer = employer;
  if (location) job.location = location;
  if (jobDescriptionUrl) job.jobDescriptionUrl = jobDescriptionUrl;
  if (applicationUrl) job.applicationUrl = applicationUrl;
  if (details) job.details = details;
  if (qualifications) job.qualifications = qualifications;

  const hasContext = Boolean(
    id ||
    title ||
    employer ||
    location ||
    jobDescriptionUrl ||
    applicationUrl ||
    details ||
    qualifications,
  );

  return { job, warnings, hasContext };
}

/** True when the value is empty (optional) or a safe, credential-free https URL. */
export function isSafeHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > JOB_CONTEXT_LIMITS.url) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.protocol === 'https:' &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function isGuidedPreparePath(pathname: string): boolean {
  const path = normalizePath(pathname).replace(/\.html$/, '');
  return path === '/prepare';
}
