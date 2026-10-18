import {
  DEFAULT_FORMAT,
  DEFAULT_TEMPLATE,
  type Contact,
  type FormatSettings,
  type ResumeTemplate,
} from '../types/resume';
import type { CoverLetter } from '../types/coverLetter';

export function updateLetter(letter: CoverLetter, patch: Partial<CoverLetter>): CoverLetter {
  return { ...letter, ...patch };
}

export function updateApplicant(
  letter: CoverLetter,
  patch: Partial<CoverLetter['applicant']>,
): CoverLetter {
  return { ...letter, applicant: { ...letter.applicant, ...patch } };
}

export function updateApplicantContact(letter: CoverLetter, patch: Partial<Contact>): CoverLetter {
  return updateApplicant(letter, {
    contact: { ...letter.applicant.contact, ...patch },
  });
}

export function updateRecipientText(letter: CoverLetter, text: string): CoverLetter {
  return { ...letter, recipient: text.split('\n') };
}

export function updateBodyParagraph(
  letter: CoverLetter,
  index: number,
  value: string,
): CoverLetter {
  return {
    ...letter,
    body: letter.body.map((paragraph, current) => (current === index ? value : paragraph)),
  };
}

export function addBodyParagraph(letter: CoverLetter): CoverLetter {
  return { ...letter, body: [...letter.body, ''] };
}

export function removeBodyParagraph(letter: CoverLetter, index: number): CoverLetter {
  if (letter.body.length <= 1) return letter;
  return { ...letter, body: letter.body.filter((_, current) => current !== index) };
}

export function updateLetterTemplate(
  letter: CoverLetter,
  patch: Partial<ResumeTemplate>,
): CoverLetter {
  return { ...letter, template: { ...letter.template, ...patch } };
}

export function updateLetterFormat(
  letter: CoverLetter,
  patch: Partial<FormatSettings>,
): CoverLetter {
  return updateLetterTemplate(letter, {
    format: { ...letter.template.format, ...patch },
  });
}

export function resetLetterTemplate(letter: CoverLetter): CoverLetter {
  return {
    ...letter,
    template: { ...DEFAULT_TEMPLATE, format: { ...DEFAULT_FORMAT } },
  };
}
