import { COVER_LETTER_SECTION_ALIASES } from './parseCoverLetter';
import { LIST_KINDS, RESUME_SECTION_ALIASES, RESUME_SECTION_TITLES } from './parse';
import type { DocumentKind } from '../types/document';
import type { SectionKind } from '../types/resume';

function aliasGroups(aliases: Record<string, string>, titles?: Record<string, string>): string {
  const groups = new Map<string, string[]>();

  for (const [alias, kind] of Object.entries(aliases)) {
    const title = titles?.[kind as SectionKind] ?? kind;
    if (!title) continue;
    const entries = groups.get(title) ?? [];
    entries.push(alias.toUpperCase());
    groups.set(title, entries);
  }

  return [...groups.entries()]
    .map(([title, entries]) => `${title}: ${entries.join(', ')}`)
    .join('\n');
}

const RESUME_SECTION_LIST = aliasGroups(RESUME_SECTION_ALIASES, RESUME_SECTION_TITLES);
const COVER_LETTER_SECTION_LIST = aliasGroups(COVER_LETTER_SECTION_ALIASES);
const RESUME_LIST_SECTIONS = [...LIST_KINDS].map((kind) => kind.toUpperCase()).join(', ');

export const RESUME_AI_EXAMPLE = `# Jordan Avery
Product engineer | jordan.avery@example.com | +1 555 0142 | Toronto, ON

## SUMMARY
Product engineer focused on calm, reliable document tools.

## EXPERIENCE
### Example Company — Senior Product Engineer
2022 – Present | Toronto, ON
- Rebuilt a document workflow used by 12,000 people.
- Reduced time-to-first-draft from nine minutes to under two.

## EDUCATION
### Example University — B.Sc. Computer Science
2014 – 2018 | Toronto, ON

## SKILLS
Languages: TypeScript, Python, SQL`;

export const COVER_LETTER_AI_EXAMPLE = `# Jordan Avery
Product engineer | jordan.avery@example.com | +1 555 0142 | Toronto, ON

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
I am writing to apply for the Senior Product Engineer role at Brightline Labs. My work has focused on calm, dependable document tools.

At Northwind Studio I led the rebuild of a document workflow used by 12,000 people.

## CLOSING
Sincerely,

## SIGNATURE
Jordan Avery`;

export const RESUME_AI_INSTRUCTIONS = `You are preparing resume content for OpenResume, a deterministic resume builder.

Output only plain structured text in the exact format below. Do not use code fences, commentary, explanations, or markdown outside this format.

Required structure:

# Full Name
Headline | email | phone | location | linkedin URL | portfolio URL

- The first line must be exactly one "# " heading with the person's name.
- The second line is optional but recommended. Separate its parts with "|". Parts are classified as email, phone, link, location, or headline.
- Do not add a second "# " heading.

Sections start with "## TITLE". Supported titles and aliases:

${RESUME_SECTION_LIST}

Any other "## Title" becomes a custom section and is preserved.

Experience, project, education, and volunteer entries:

### Company — Role
2022 – Present | Toronto, ON
- A specific achievement.
- Another contribution.

- "### " starts an entry. Separate the title and subtitle with " — ", " – ", or " - ".
- The line after an entry may be metadata in the form "DATES | LOCATION".
- Bullets start with "- " (or "* "). Continuation lines join the previous paragraph or bullet.

Skills:

Languages: TypeScript, Python, SQL

- In a SKILLS section, "Label: values" creates a labeled group.
- Other lines are preserved as text.

List sections:

- These sections accept "- " entries: ${RESUME_LIST_SECTIONS}.

Rules:
- Use only facts the person provides. Never invent employers, job titles, dates, degrees, certifications, skills, metrics, or achievements.
- Preserve the person's wording, punctuation, and capitalization. Do not summarize or embellish.
- Use the exact markers. Do not use tables, code fences, bold, italics, or other markdown.
- Omit optional sections that have no content.
- Output one resume only. Do not include notes, questions, or explanations.

Example:

${RESUME_AI_EXAMPLE}`;

export const COVER_LETTER_AI_INSTRUCTIONS = `You are preparing a cover letter for OpenResume, a deterministic document builder.

Output only plain structured text in the exact format below. Do not use code fences, commentary, explanations, or markdown outside this format.

Required structure:

# Full Name
Headline (optional) | email | phone | location | link

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
First paragraph.

Second paragraph.

## CLOSING
Sincerely,

## SIGNATURE
Full Name

Section titles and aliases:

${COVER_LETTER_SECTION_LIST}

Rules:
- Use exactly one "# " heading for the applicant's name.
- The next non-empty line is the contact line. Separate its parts with "|".
- Use "## " section markers. Put one detail per line in RECIPIENT.
- BODY contains the letter paragraphs. Separate paragraphs with a blank line. Do not use bullets.
- The required content is the applicant's name and at least one body paragraph. DATE, RECIPIENT, POSITION, SALUTATION, CLOSING, SIGNATURE, and the contact line are optional; include them when the person provides the information.
- Use only facts the person provides. Never invent a company, role, date, achievement, relationship, or qualification.
- Preserve the person's wording, punctuation, and capitalization. Do not add claims or flattery that were not provided.
- Use the exact markers. Do not use tables, code fences, bold, italics, or other markdown.
- Output one cover letter only. Do not include notes, questions, or explanations.

Example:

${COVER_LETTER_AI_EXAMPLE}`;

export function getAiInstructions(kind: DocumentKind): string {
  return kind === 'resume' ? RESUME_AI_INSTRUCTIONS : COVER_LETTER_AI_INSTRUCTIONS;
}
