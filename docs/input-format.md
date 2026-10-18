# Input format

OpenResume parses a small, deterministic subset of Markdown. Structure comes from line markers, not indentation. Content is preserved exactly except for structural whitespace.

## Canonical example

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
