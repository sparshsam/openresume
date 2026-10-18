# Interface

OpenResume is a document production workspace for two document types: a resume and a cover letter. Structured text is the primary preparation path; manual editing remains fully available after building.

## Landing

The first screen presents two substantial, independently floating cards:

- **Resume** — **Build Resume** starts a precise, two-column resume.
- **Cover Letter** — **Build Cover Letter** starts a calm, single-column business letter.

The cards sit side by side on desktop and stack on smaller screens. Each is a single clickable surface with a visible primary action; the whole card opens the matching preparation screen.

Build always opens preparation. When a document exists in the current session, its card also offers **Open resume** or **Open cover letter** to return to that workspace. Reloading the page clears both documents; there are no saved-draft badges or restoration controls.

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

Building replaces the previous document of that type in the current session immediately. No confirmation dialog is shown.

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

When a resume exists, **Back to resume** returns to the resume workspace without changing either document.

## Matching cover letter

From the resume workspace, **Create matching cover letter** opens the cover letter preparation screen with:

- The applicant's name.
- The applicant's headline and contact information.
- Empty date, recipient, position, salutation, body, and closing sections.
- The applicant's name as the signature.

No letter body is generated. The user writes it. The resume is never modified, and **Back** returns to the resume workspace. Building the letter preserves the resume and creates or replaces the in-memory cover letter.

## Session behavior and feedback

- Resume and cover letter content lives in memory for the current application session.
- Navigating between the landing page, preparation screens, and workspaces preserves both documents.
- Reloading, closing, or leaving the page discards them. No document content is written to `localStorage` or `sessionStorage`.
- The interface theme remains persisted under `openresume-theme`.
- Toasts confirm builds, clipboard copy, formatting reset, and PDF/Word exports. Toasts can be dismissed and time out automatically.
- Structured-content errors appear inline next to the preparation textarea.
- Native browser `alert`, `confirm`, and `prompt` dialogs are not used.
- Earlier draft keys are removed on startup only when their values validate as OpenResume documents.

## Themes and footer

Light/dark/system behavior is unchanged: `data-theme`, system preference on first load, live system updates while unset, and an inline pre-hydration script to prevent a flash. The favicon, `theme-color`, and header brand mark follow the selected theme. The resume and cover letter documents keep fixed colors in both themes.

The footer remains the Kovina-compliant strip with version, attribution, and minimal links.

## Keyboard and accessibility

- `Ctrl`/`⌘` + `Enter` builds from the preparation screen.
- `Escape` returns to the previous workspace or landing page.
- The preparation textarea is focused on entry.
- Fields are labeled; sections use headings and native controls.
- Icons are decorative and never carry the only accessible name.
- Toasts announce success with `role="status"` and errors with `role="alert"`; each has a labeled dismiss button.

## Responsive behavior

| Width      | Behavior                                                                |
| ---------- | ----------------------------------------------------------------------- |
| ≥ 1041px   | Editor rail and preview side by side                                    |
| 721–1040px | Editor above preview                                                    |
| ≤ 720px    | Header becomes two rows: brand + theme, then icon-only document actions |
| ≤ 760px    | Landing cards stack; preparation textarea shrinks                       |
| ≤ 560px    | Formatting controls and footer stack; toasts span the viewport margins  |

At every width the document page scales to fit; text remains selectable and the document is never inverted for dark mode.
