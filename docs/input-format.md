# Input format

OpenResume parses a small, deterministic subset of Markdown. Structure comes from line markers, not indentation. Content is preserved exactly except for structural whitespace.

## One document at a time

Building a document replaces that document after an explicit confirmation when a draft already exists. The other document is never touched.

Text containing more than one top-level `#` heading is rejected with an error. This prevents concatenated documents from being merged into a single, mixed file.

## Code fences on paste

AI assistants often wrap the whole document in one plain-text code block. OpenResume accepts that delivery container so the response can be pasted as-is.

- An unlabelled fence or a `text`-labelled fence is accepted.
- The first non-empty line must be the opening fence and the last non-empty line must be the closing fence.
- Exactly one complete enclosing pair is removed; the interior is preserved exactly.
- A fence surrounded by prose, an unbalanced fence, two separate fence pairs, or a fence containing another fence line is treated as ordinary text and is not removed.
- The fence is not document content. Copy the block contents directly when the assistant offers that option.

The compatibility rule applies to both the resume and cover letter parsers. It runs before any marker is read, so `documentCount`, warnings, and validation behave the same as for unfenced input.

## Resume format

### Canonical example

```text
# Jordan Avery
Product-minded software generalist | jordan.avery@example.com | +1 555 0142 | Toronto, ON | linkedin.com/in/jordanavery | github.com/jordanavery

## SUMMARY
Product-minded software generalist with eight years of experience turning ambiguous problems into calm, dependable products.

## EXPERIENCE
### Northwind Studio — Senior Product Engineer
2022 – Present | Toronto, ON
- Led the rebuild of a document workflow used by 12,000 people.
- Designed and shipped a local-first editing model.

### Fieldnote Labs — Software Engineer
2019 – 2022 | Remote
- Built the core scheduling engine in TypeScript.

## EDUCATION
### Example University — B.Sc. Computer Science
2013 – 2017 | Toronto, ON

## SKILLS
Languages: TypeScript, JavaScript, Python, SQL
Product: Discovery, roadmapping, user research
Tools: React, Vite, Node.js, Git

## PROJECTS
### OpenResume
TypeScript, React, Vite
- A privacy-first resume builder.

## CERTIFICATIONS
- Certified Accessibility Specialist — Example Institute, 2023

## LANGUAGES
- English — Native
- French — Professional working proficiency

## SPEAKING
- "Deterministic Documents" — Example Conf, 2025
```

## Markers

| Marker                      | Meaning                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `# Name`                    | Resume owner. The first `#` line wins; a second is ignored with a warning.                 |
| Plain line after `#`        | Contact line. Split on `                                                                   | `.  |
| `## Title`                  | Section start. Known titles map to canonical kinds; unknown titles become custom sections. |
| `### Title — Subtitle`      | Entry start. `—`, `–`, or `-` separates title from subtitle.                               |
| `- text` or `* text`        | Bullet.                                                                                    |
| Plain line inside a section | Paragraph text, continuation, or entry metadata.                                           |

## Contact line

Parts are separated by `|` and classified in order:

1. Contains `@` → email.
2. Phone-shaped → phone.
3. URL-shaped (`https://`, `www.`, or `domain.tld/path`) → link.
4. Before any contact detail → headline.
5. Otherwise → location, or headline if location is already set.

Links are displayed by their label and exported with an `https://` scheme when one is missing.

## Section aliases

| Kind           | Accepted titles                                                                          |
| -------------- | ---------------------------------------------------------------------------------------- |
| Summary        | `SUMMARY`, `OBJECTIVE`, `PROFILE`, `ABOUT`, `PROFESSIONAL SUMMARY`                       |
| Experience     | `EXPERIENCE`, `WORK EXPERIENCE`, `EMPLOYMENT`, `WORK HISTORY`, `PROFESSIONAL EXPERIENCE` |
| Education      | `EDUCATION`, `ACADEMIC BACKGROUND`                                                       |
| Skills         | `SKILLS`, `TECHNICAL SKILLS`, `CORE SKILLS`, `EXPERTISE`                                 |
| Projects       | `PROJECTS`, `SELECTED PROJECTS`, `PERSONAL PROJECTS`                                     |
| Certifications | `CERTIFICATIONS`, `CERTIFICATES`, `LICENSES`                                             |
| Awards         | `AWARDS`, `HONORS`, `ACHIEVEMENTS`                                                       |
| Languages      | `LANGUAGES`                                                                              |
| Volunteer      | `VOLUNTEER`, `VOLUNTEERING`, `COMMUNITY`, `VOLUNTEER EXPERIENCE`                         |
| Interests      | `INTERESTS`, `HOBBIES`                                                                   |
| Custom         | Anything else; the original title is preserved                                           |

Aliases are case-insensitive and ignore trailing colons.

## Entries

The line immediately after a `###` header may be metadata:

```text
2022 – Present | Toronto, ON
```

- Two or more parts → first is the date range, the rest form the location.
- One part containing a year, month, `Present`, or `Current` → date range.
- One part without a date → location.

A metadata line is recognised only before the entry has body text or bullets.

## Skills

Inside a skills section, `Label: values` becomes a labeled entry:

```text
Languages: TypeScript, Python, SQL
```

Lines without a colon are preserved as paragraph text.

## List sections

In `CERTIFICATIONS`, `AWARDS`, `LANGUAGES`, and `INTERESTS`, bullets become individual entries. In `LANGUAGES` and `INTERESTS`, entries are rendered with a bullet glyph; certifications and awards render as plain lines.

## Continuation

A non-marker line following a bullet joins that bullet with a single space. A non-marker line following paragraph text joins the paragraph with a single space. Blank lines end a continuation.

## Preservation rules

- Case, punctuation, em dashes, and double spaces inside content are preserved.
- Leading and trailing whitespace on a line is trimmed.
- The parser never summarizes, rewrites, or reorders content.
- Unknown structures are kept as paragraph text rather than discarded.

## Warnings

The parser returns warnings alongside the model:

- No content found.
- No name found.
- A second `#` heading was ignored.
- An entry or bullet appeared before any section, so an `ADDITIONAL` section was created.

Warnings never block import and never delete content.

## Cover letter format

### Canonical example

```text
# Jordan Avery
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
First paragraph.

Second paragraph.

## CLOSING
Sincerely,

## SIGNATURE
Jordan Avery
```

### Header and contact

- The first line must be `# Full Name`.
- The next non-empty line is optional contact information, split on `|` and classified as email, phone, link, location, or headline (same rules as the resume).
- Do not add a second `#` heading.

### Sections

| Section    | Accepted titles                                                          | Content                                             |
| ---------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| Date       | `DATE`                                                                   | One or more lines, joined with spaces.              |
| Recipient  | `RECIPIENT`, `RECIPIENT DETAILS`, `RECIPIENT ADDRESS`, `ADDRESSEE`       | One detail per line: name, title, company, address. |
| Position   | `POSITION`, `ROLE`, `SUBJECT`, `RE`, `POSITION APPLIED FOR`, `JOB TITLE` | Subject or role line, rendered bold.                |
| Salutation | `SALUTATION`, `GREETING`                                                 | Greeting line.                                      |
| Body       | `BODY`, `LETTER`, `CONTENT`, `MESSAGE`                                   | Paragraphs separated by blank lines.                |
| Closing    | `CLOSING`, `SIGN-OFF`, `SIGN OFF`                                        | Sign-off line.                                      |
| Signature  | `SIGNATURE`, `SIGNED`                                                    | Signature/name line.                                |

Unknown sections are appended to the body with a warning so content is not lost.

### Required and optional fields

- **Required:** applicant name and at least one body paragraph.
- **Optional:** contact line, date, recipient details, position/subject, salutation, closing, and signature. Omit any section you do not have; no placeholder text is invented.
- Blank optional sections are skipped in the preview, PDF, and DOCX.

### Body paragraphs

Lines within one paragraph are joined with a space. A blank line starts a new paragraph. Do not use bullets in the body.

### Preservation and warnings

- Case, punctuation, and spacing inside content are preserved.
- Missing name or body blocks the build with a clear message.
- Unknown sections are preserved in the body with a warning.
- More than one top-level `#` heading is rejected.

### AI instructions

Use **Copy AI Instructions** in the cover letter preparation screen for a paste-ready template that matches this parser exactly. The same instructions are available for resumes.
