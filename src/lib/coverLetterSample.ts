import { parseCoverLetter } from './parseCoverLetter';
import type { CoverLetter } from '../types/coverLetter';

export const SAMPLE_COVER_LETTER_TEXT = `# Jordan Avery
Product-minded software generalist | jordan.avery@example.com | +1 555 0142 | Toronto, ON | linkedin.com/in/jordanavery

## DATE
October 18, 2026

## RECIPIENT
Morgan Lee
Hiring Manager
Brightline Labs
123 Example Street
Toronto, ON M5V 1A1

## POSITION
Senior Product Engineer

## SALUTATION
Dear Ms. Lee,

## BODY
I am writing to apply for the Senior Product Engineer role at Brightline Labs. Over the past eight years I have built calm, dependable document tools, and I would like to bring that focus to your team.

At Northwind Studio I led the rebuild of a document workflow used by 12,000 people. The project cut time-to-first-draft from nine minutes to under two, and it taught me how much careful interface work matters when people are trying to get something done.

I would welcome the chance to discuss how my experience with local-first products and accessible interfaces could support Brightline's work. Thank you for your time and consideration.

## CLOSING
Sincerely,

## SIGNATURE
Jordan Avery
`;

export function createSampleCoverLetter(): CoverLetter {
  return parseCoverLetter(SAMPLE_COVER_LETTER_TEXT).coverLetter;
}

export const SAMPLE_COVER_LETTER: CoverLetter = createSampleCoverLetter();
