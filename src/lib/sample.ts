import { parseResume } from './parse';
import type { Resume } from '../types/resume';

export const SAMPLE_RESUME_TEXT = `# Jordan Avery
Product-minded software generalist | jordan.avery@example.com | +1 555 0142 | Toronto, ON | linkedin.com/in/jordanavery | github.com/jordanavery

## SUMMARY
Product-minded software generalist with eight years of experience turning ambiguous problems into calm, dependable products. Comfortable owning discovery, delivery, and the small details that make software feel considered.

## EXPERIENCE
### Northwind Studio — Senior Product Engineer
2022 – Present | Toronto, ON
- Led the rebuild of a document workflow used by 12,000 people, cutting time-to-first-draft from nine minutes to under two.
- Designed and shipped a local-first editing model that removed three network dependencies and reduced support tickets by 38%.
- Mentored four engineers; introduced a weekly design-and-code review that shortened review cycles from six days to two.

### Fieldnote Labs — Software Engineer
2019 – 2022 | Remote
- Built the core scheduling engine in TypeScript, covering time zones, recurrence, and conflict resolution.
- Replaced a brittle CSV pipeline with a deterministic parser and test suite, eliminating a recurring class of data loss bugs.

### Lantern Cooperative — Junior Developer
2017 – 2019 | Toronto, ON
- Maintained an internal operations tool and automated month-end reporting, saving roughly two days of manual work each month.

## EDUCATION
### Example University — B.Sc. Computer Science
2013 – 2017 | Toronto, ON

### Example College — Certificate, Technical Writing
2018 – 2018 | Online

## SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Product: Discovery, roadmapping, user research, writing
Tools: React, Vite, Node.js, Git, Figma, Linear
Practices: Local-first design, accessibility, automated testing

## PROJECTS
### OpenResume
TypeScript, React, Vite
- A privacy-first resume builder that turns structured text into precise PDF and DOCX output.

### Quiet Hours
TypeScript, Node.js
- A small scheduling utility for protecting focus time across calendars.

## CERTIFICATIONS
- Certified Accessibility Specialist — Example Institute, 2023

## AWARDS
- Internal Craft Award — Northwind Studio, 2024

## LANGUAGES
- English — Native
- French — Professional working proficiency

## INTERESTS
- Long-distance running
- Bookbinding
- Quiet software

## SPEAKING
- "Deterministic Documents" — Example Conf, 2025
`;

export function createSampleResume(): Resume {
  const { resume } = parseResume(SAMPLE_RESUME_TEXT);
  return resume;
}

export const SAMPLE_RESUME: Resume = createSampleResume();
