# Interface

OpenResume is a document production workspace for two document types: a resume and a cover letter. Structured text is the primary preparation path; manual editing remains fully available after building.

## Landing

The first screen presents three substantial, independently floating cards:

- **Resume** — **Build Resume** starts a precise, two-column resume.
- **Cover Letter** — **Build Cover Letter** starts a calm, single-column business letter.
- **Application Kit** — **Build Application Kit** starts a combined resume-and-letter workflow.

Each card also offers **Copy AI Instructions**, which copies that document's template without entering the builder. The cards use three balanced columns on desktop, two columns at tablet widths, and one column on mobile.

Each card is a single clickable surface with a visible primary action; the whole card opens the matching preparation screen except for the secondary Copy and Open controls, which sit above the stretched action and do not navigate.

Build always opens preparation. When a document exists in the current session, its card also offers **Open resume**, **Open cover letter**, or **Open application kit** to return to that workspace. Reloading the page clears all documents; there are no saved-draft badges or restoration controls.

## Preparation

Each document has a preparation screen with:

- **Create your resume** / **Create your cover letter**.
- A large structured-text area.
- **Build Resume** / **Build Cover Letter** as the primary action.
- **Copy AI Instructions** — copies the complete, parser-compatible template.
- **Load Example** — fills the fictional example for that document type.
- **Use resume details** on the cover letter screen when a resume exists.
- Back navigation to the previous workspace or the landing page.

The screen also presents the six-step AI workflow:

1. Copy AI Instructions.
2. Paste them into ChatGPT or another AI assistant.
3. Provide your details and the target job description.
4. Copy the generated structured text.
5. Paste it into OpenResume.
6. Build the document (or both documents, for an Application Kit).

The workflow is an ordered list with an accessible label, not a second panel or wizard. Copying shows “AI instructions copied. Paste them into your AI assistant.”

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

## Formatting

The workspace formatting panel contains page size, margins, font size, spacing, density, and **Accent Colour**. Resumes also show **Resume layout** (Professional Two-Column or ATS Simple); **Column spacing** appears only for the two-column layout, and ATS Simple adds a short note explaining its single-column, table-free output and that no layout guarantees compatibility with every applicant tracking system.

- Accent Colour is a native radio group of nine swatches: Green (default), Blue, Navy, Teal, Purple, Red, Orange, Brown, and Charcoal.
- Each swatch has an accessible colour name, keyboard operation, a clear selected ring, and a focus indicator.
- The selected colour name is shown in text.
- The accent updates the live document header, rule, and resume section headings. The same value flows into PDF and DOCX.
- Accent is per document and survives navigation for the session. It is not stored in the browser.
- **Reset to defaults** restores Green and the standard formatting presets.

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

The preview is a single-column letter with the same OpenResume letterhead, typography, and fixed document colors as the resume. Formatting is per document and includes page size, margins, font size, line spacing, section spacing, paragraph spacing, content density, and Accent Colour. Bullet and column spacing are hidden because they do not apply.

When a resume exists, **Back to resume** returns to the resume workspace without changing either document.

## Application Kit workspace

The kit workspace reuses the existing resume editor, cover letter editor, preview, formatting panel, accent palette, and export engines. It adds one compact toolbar below the header:

- **Application Kit** label and “Two coordinated documents” hint.
- Accessible **Resume** and **Cover Letter** tabs: `role="tablist"`, `aria-selected`, `aria-controls`, roving `tabIndex`, arrow-key/Home/End navigation, and focus moved to the newly selected tab.
- **Document order** select: **Cover Letter → Resume** (default) or **Resume → Cover Letter**, applying to both combined exports.
- **Combined PDF** and **Combined Word** export actions.
- **Download separately** disclosure with Resume PDF, Resume Word, Cover letter PDF, and Cover letter Word.

The header identifies the workspace as **Application Kit**, **New** starts a new kit, and the header's single-document PDF/Word buttons are hidden so exports have one home. The active tab's formatting panel and accent remain independent; switching tabs closes the panel and preserves the other document's settings.

The combined PDF follows the selected document order, starts the second document on a new page, and uses each document's own page dimensions. The combined Word document follows the same order and uses an explicit page break when both documents share page geometry; when sizes or margins differ, it uses a `nextPage` Word section for the second document. Separate downloads use the existing per-document exporters and filenames and are unaffected by the order setting.

The order setting is session-only UI state, like the documents. It is not part of either document's template and is never stored.

Building a kit is atomic: if either section fails, the preparation screen shows the errors and neither existing document is replaced.

## Matching cover letter

From the resume workspace, **Create matching cover letter** opens the cover letter preparation screen with:

- The applicant's name.
- The applicant's headline and contact information.
- Empty date, recipient, position, salutation, body, and closing sections.
- The applicant's name as the signature.

No letter body is generated. The user writes it. The resume is never modified, and **Back** returns to the resume workspace. Building the letter preserves the resume and creates or replaces the in-memory cover letter.

## Session behavior and feedback

- Resume and cover letter content lives in memory for the current application session.
- Navigating between the landing page, preparation screens, workspaces, and public information pages preserves both documents.
- Browser Back and Forward operate on the information-page paths without reloading the application.
- Reloading, closing, or leaving the page discards them. No document content is written to `localStorage` or `sessionStorage`.
- The interface theme remains persisted under `openresume-theme`.
- Toasts confirm builds, clipboard copy, formatting reset, and PDF/Word exports. Toasts can be dismissed and time out automatically.
- Structured-content errors appear inline next to the preparation textarea.
- Native browser `alert`, `confirm`, and `prompt` dialogs are not used.
- Earlier draft keys are removed on startup only when their values validate as OpenResume documents.

## Public pages

`/about`, `/privacy`, and `/terms` render inside the same header, footer, theme provider, and responsive shell as the builder.

- Each page has a single `h1`, ordered `h2` sections, a comfortable reading column, and a **Back to builder** action at the top and bottom.
- The footer links to About, Privacy, and Terms on every screen.
- Internal links use client-side history navigation, so the builder's in-memory resume and cover letter survive a round trip.
- Direct loads and refreshes are served by separate static HTML shells with the page's own title, description, canonical URL, Open Graph tags, and Twitter card.
- The footer remains visually quiet: About, Privacy, Terms, GitHub, and MIT license.

## Themes and footer

Light/dark/system behavior is unchanged: `data-theme`, system preference on first load, live system updates while unset, and an inline pre-hydration script to prevent a flash. The `theme-color` follows the selected theme, while the favicon and header brand mark stay on the light artwork in both themes; the near-black variants are not used in the interface because they read poorly on the light page. The resume and cover letter documents keep fixed neutral colors plus their own accent in both themes. All four page types share the same header and footer.

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
