import { COVER_LETTER_DELIMITER, RESUME_DELIMITER } from './applicationKitFormat';
import { stripEnclosingCodeFence } from './codeFence';
import { parseCoverLetter } from './parseCoverLetter';
import { parseResume } from './parse';
import type { CoverLetter } from '../types/coverLetter';
import type { Resume } from '../types/resume';

export type ApplicationKitParseResult =
  | { ok: true; resume: Resume; coverLetter: CoverLetter; warnings: string[] }
  | { ok: false; errors: string[] };

function failure(errors: string[]): ApplicationKitParseResult {
  return { ok: false, errors };
}

function normalizeValue(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function parseApplicationKit(input: string): ApplicationKitParseResult {
  if (!input.trim()) {
    return failure(['Paste the combined resume and cover letter text before building.']);
  }

  const normalized = input.replace(/\r\n?/g, '\n');
  const stripped = stripEnclosingCodeFence(normalized);
  const hasFenceLine = normalized.split('\n').some((line) => line.trim().startsWith('```'));

  if (hasFenceLine && stripped === normalized) {
    return failure([
      'The enclosing code fence is incomplete or ambiguous. Use one complete plain-text code block, or remove the fence.',
    ]);
  }

  const lines = stripped.split('\n');
  const resumeDelimiters = lines
    .map((line, index) => ({ text: line.trim(), index }))
    .filter((line) => line.text === RESUME_DELIMITER);
  const coverLetterDelimiters = lines
    .map((line, index) => ({ text: line.trim(), index }))
    .filter((line) => line.text === COVER_LETTER_DELIMITER);

  const errors: string[] = [];
  if (resumeDelimiters.length === 0) {
    errors.push(`Add the resume delimiter exactly as shown: ${RESUME_DELIMITER}`);
  }
  if (coverLetterDelimiters.length === 0) {
    errors.push(`Add the cover letter delimiter exactly as shown: ${COVER_LETTER_DELIMITER}`);
  }
  if (resumeDelimiters.length > 1) {
    errors.push('The resume delimiter appears more than once. Include one resume only.');
  }
  if (coverLetterDelimiters.length > 1) {
    errors.push(
      'The cover letter delimiter appears more than once. Include one cover letter only.',
    );
  }
  if (errors.length > 0) return failure(errors);

  const [resumeDelimiter] = resumeDelimiters;
  const [coverLetterDelimiter] = coverLetterDelimiters;

  if (resumeDelimiter.index > coverLetterDelimiter.index) {
    return failure([
      'Put the resume before the cover letter. The delimiters are in the wrong order.',
    ]);
  }

  if (lines.slice(0, resumeDelimiter.index).some((line) => line.trim())) {
    return failure([
      'Remove the text before the resume delimiter. The combined input must begin with the resume delimiter.',
    ]);
  }

  const resumeText = lines
    .slice(resumeDelimiter.index + 1, coverLetterDelimiter.index)
    .join('\n')
    .trim();
  const coverLetterText = lines
    .slice(coverLetterDelimiter.index + 1)
    .join('\n')
    .trim();

  if (!resumeText) {
    errors.push('The resume section is empty. Add resume content after the resume delimiter.');
  }
  if (!coverLetterText) {
    errors.push(
      'The cover letter section is empty. Add cover letter content after the cover letter delimiter.',
    );
  }
  if (errors.length > 0) return failure(errors);

  const resumeResult = parseResume(resumeText);
  const coverLetterResult = parseCoverLetter(coverLetterText);

  if (resumeResult.documentCount === 0) {
    errors.push('The resume section needs one top-level "# Full Name" heading.');
  } else if (resumeResult.documentCount > 1) {
    errors.push(
      'The resume section contains more than one top-level "# " heading. Include one resume only.',
    );
  }
  if (!resumeResult.resume.header.name.trim()) {
    errors.push('The resume section needs the applicant name after "# ".');
  }
  if (coverLetterResult.documentCount === 0) {
    errors.push('The cover letter section needs one top-level "# Full Name" heading.');
  } else if (coverLetterResult.documentCount > 1) {
    errors.push(
      'The cover letter section contains more than one top-level "# " heading. Include one cover letter only.',
    );
  }
  if (!coverLetterResult.coverLetter.applicant.name.trim()) {
    errors.push('The cover letter section needs the applicant name after "# ".');
  }
  if (coverLetterResult.coverLetter.body.length === 0) {
    errors.push('The cover letter section needs a "## BODY" section with at least one paragraph.');
  }
  if (errors.length > 0) return failure(errors);

  const warnings = [...resumeResult.warnings, ...coverLetterResult.warnings];
  const resumeName = resumeResult.resume.header.name.trim();
  const coverLetterName = coverLetterResult.coverLetter.applicant.name.trim();

  if (normalizeValue(resumeName) !== normalizeValue(coverLetterName)) {
    warnings.push(
      `The resume and cover letter use different applicant names ("${resumeName}" and "${coverLetterName}"). Review both documents.`,
    );
  }

  for (const field of ['email', 'phone', 'location'] as const) {
    const resumeValue = resumeResult.resume.contact[field]?.trim();
    const coverLetterValue = coverLetterResult.coverLetter.applicant.contact[field]?.trim();
    if (
      resumeValue &&
      coverLetterValue &&
      normalizeValue(resumeValue) !== normalizeValue(coverLetterValue)
    ) {
      warnings.push(
        `The resume and cover letter use different ${field} values ("${resumeValue}" and "${coverLetterValue}"). Review both documents.`,
      );
    }
  }

  return {
    ok: true,
    resume: resumeResult.resume,
    coverLetter: coverLetterResult.coverLetter,
    warnings,
  };
}
