# Interface

OpenResume is a document production workspace for two document types: a resume and a cover letter. Structured text is the primary preparation path; manual editing remains fully available after building.

## Landing

The first screen presents two substantial, independently floating cards:

- **Resume** — **Build Resume** starts a precise, two-column resume.
- **Cover Letter** — **Build Cover Letter** starts a calm, single-column business letter.

The cards sit side by side on desktop and stack on smaller screens. Each is a single clickable surface with a visible primary action; the whole card opens the matching preparation screen.

A saved document never changes that destination. If a draft exists, the card shows a **Saved draft** badge and a separate **Continue Saved Resume** or **Continue Saved Cover Letter** action. Build always means preparation; Continue Saved is the only way to reopen an existing workspace from the landing page. Both documents can be saved independently, and choosing one never changes the other.

## Preparation

Each document has a preparation screen with:

- **Create your resume** / **Create your cover letter**.
- A large structured-text area.
- **Build Resume** / **Build Cover Letter** as the primary action.
- **Copy AI Instructions** — copies the complete, parser-compatible template.
- **Load Example** — fills the fictional example for that document type.
- **Use resume details** on the cover letter screen when a resume exists.
- Back navigation to the previous workspace or the landing page.

The old collapsible example-format interaction has been removed. The AI instructions are the canonical format reference and are copied from the same source that tests check against the parsers.

Building over an existing draft shows an explicit confirmation before replacing it. Canceling leaves the saved document untouched.

## Header

- **Brand** is labeled **OpenResume home** on the landing and preparation screens, and **Back to document selection** in a workspace; both return to the landing page.
- In a workspace, a small label shows **Resume** or **Cover Letter**.
- **New** opens preparation for the current document type.
- **Format** toggles document-specific formatting controls.
- **PDF** and **Word** export the current document.
- **Theme** toggles light/dark and stays far right.

Landing and preparation screens show only the brand and theme controls. All actions are native buttons with accessible names, titles, and focus-visible rings.

## Resume workspace

The existing resume editor remains: identity, contact links, sections, entries, bullets, section ordering, column assignment, and live preview. **Create matching cover letter** appears as a quiet action in the identity section.

## Cover letter workspace

Fields:

- Applicant name, optional headline, email, phone, location, and links.
- Date.
- Recipient details, one line per row.
- Position or subject.
- Salutation.
- Multiple body paragraphs with add/remove controls.
- Closing and signature.

The preview is a single-column letter with the same OpenResume letterhead, typography, and fixed document colors as the resume. Formatting is per document and includes page size, margins, font size, line spacing, section spacing, paragraph spacing, and content density. Bullet and column spacing are hidden because they do not apply.

When a resume exists, **Back to resume** returns to the resume workspace without touching either draft.

## Matching cover letter

From the resume workspace, **Create matching cover letter** opens the cover letter preparation screen with:

- The applicant's name.
- The applicant's headline and contact information.
- Empty date, recipient, position, salutation, body, and closing sections.
- The applicant's name as the signature.

No letter body is generated. The user writes it. The resume is never modified, and **Back** returns to the resume workspace. Building the letter preserves the resume and creates or replaces the independent cover-letter draft (with confirmation if one exists).

## Drafts and migration

| Document     | Storage key                  |
| ------------ | ---------------------------- |
| Resume       | `openresume:draft.v1`        |
| Cover letter | `openresume:cover-letter.v1` |
| Theme        | `openresume-theme`           |

- v0.1.2 resume drafts load unchanged; the new paragraph-spacing default is added during normalization.
- Building one document never deletes or overwrites the other.
- No destructive action runs without confirmation when an existing draft would be replaced.

## Themes and footer

Light/dark/system behavior is unchanged: `data-theme`, system preference on first load, live system updates while unset, and an inline pre-hydration script to prevent a flash. The resume and cover letter documents keep fixed colors in both themes.

The footer remains the Kovina-compliant strip with version, attribution, and minimal links.

## Keyboard and accessibility

- `Ctrl`/`⌘` + `Enter` builds from the preparation screen.
- `Escape` returns to the previous workspace or landing page.
- The preparation textarea is focused on entry.
- Fields are labeled; sections use headings and native controls.
- Icons are decorative and never carry the only accessible name.

## Responsive behavior

| Width      | Behavior                                                                |
| ---------- | ----------------------------------------------------------------------- |
| ≥ 1041px   | Editor rail and preview side by side                                    |
| 721–1040px | Editor above preview                                                    |
| ≤ 720px    | Header becomes two rows: brand + theme, then icon-only document actions |
| ≤ 760px    | Landing cards stack; preparation textarea shrinks                       |
| ≤ 560px    | Formatting controls and footer stack                                    |

At every width the document page scales to fit; text remains selectable and the document is never inverted for dark mode.
