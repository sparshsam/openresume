# Changelog

All notable changes to this project will be documented in this file.

## [0.1.9] — 2026-10-21

### Added

- Application Kit: a third document-building workflow that creates a tailored resume and matching cover letter from one combined AI response.
- Combined AI instruction template with one plain-text code block and the exact `=== OPENRESUME: RESUME ===` and `=== OPENRESUME: COVER LETTER ===` delimiters.
- Combined parser (`parseApplicationKit`) that validates both documents atomically, rejects ambiguous boundaries, and warns about cross-document applicant or contact inconsistencies without rewriting them.
- Copy AI Instructions on every homepage card, including the new Application Kit card.
- Tabbed Application Kit workspace with accessible Resume and Cover Letter tabs, independent editing and formatting, and the existing editors and preview.
- Combined PDF export with the cover letter first and the resume on a new page, preserving selectable text, page sizes, accents, and pagination.
- Combined DOCX export with the cover letter first, an explicit page break when geometry matches, and Word sections when page sizes or margins differ.
- Separate resume and cover letter PDF and Word downloads from the kit workspace.

### Changed

- The homepage presents three balanced cards on desktop, two at tablet widths, and one on mobile.
- The header identifies the combined workflow as Application Kit and starts a new kit from New.
- Both standalone parsers, editors, exports, and session behavior are unchanged.
- Version bumped to 0.1.9.

### Fixed

- Documentation no longer says a replacement build requires confirmation; the application has always replaced the selected document silently.

## [0.1.8] — 2026-10-20

### Added

- AI instruction templates now require exactly one plain-text code block containing the complete document, with literal `#`, `##`, and `###` markers preserved inside it.
- Preparation screens show the six-step copy-and-paste workflow so the delivery container is easy to follow.
- Both parsers accept one complete enclosing code fence (`text`-labelled or unlabelled) and remove it before parsing, preserving the interior exactly.

### Changed

- Resume and cover letter templates now include role, task, output, formatting, content-quality, and conflict-handling guidance generated from parser-supported headings.
- The copy confirmation now tells users to paste the instructions into their AI assistant.
- Version bumped to 0.1.8.

### Fixed

- AI-generated documents copied from ChatGPT or a similar assistant no longer lose literal heading markers when the response is wrapped in a code fence.

## [0.1.7] — 2026-10-18

### Added

- Public About, Privacy Policy, and Terms of Use pages with shared header, footer, theme, and responsive layout.
- Client-side navigation between the builder and information pages that preserves in-memory documents.
- Direct URL support for `/about`, `/privacy`, and `/terms` through static Vite pages and Vercel clean URLs.
- Page-specific titles, descriptions, canonical URLs, Open Graph metadata, Twitter cards, and homepage software structured data.
- `robots.txt` and `sitemap.xml` using `https://resume.kovina.org` as the canonical origin, with `noindex` reserved for the original Vercel host.
- About/Privacy/Terms links in the shared footer.
- Accent Colour formatting control with Green, Blue, Navy, Teal, Purple, Red, Orange, Brown, and Charcoal presets, applied consistently to the preview, PDF, and DOCX.
- Per-document accent state that survives navigation, resets with formatting, and is never persisted.

### Changed

- The footer now prioritizes the public information pages and the GitHub source link.
- Light and dark logo display is reversed: the light interface now uses the dark-background artwork and the dark interface uses the light-background artwork, including favicons and the header mark. File names and generated assets are unchanged.
- The application shell uses the current pathname to determine whether the builder, About, Privacy, or Terms page is active.
- README, deployment, architecture, interface, CLAUDE, and AGENTS documentation updated for the public pages and routing.

### Fixed

- Internal documentation navigation no longer causes a reload that would discard the session documents.
- Page metadata now updates on client-side navigation.

## [0.1.6] — 2026-10-18

### Added

- Authoritative OpenResume light and dark logo masters under `assets/branding/source-assets/`, preserved byte-for-byte.
- Reproducible icon generation from those masters with light and dark favicons, application icons, Apple touch icons, Microsoft tile, and social preview assets.
- Theme-aware favicon and header brand mark selection, including the pre-hydration theme script.
- Branding documentation, source-master provenance, and automated asset checks for dimensions, file validity, and the multi-resolution ICO.

### Changed

- Replaced the placeholder generated icon with the supplied OpenResume identity.
- Updated the document description, Open Graph metadata, Twitter card, and theme-color metadata.
- Verified Vercel's automatic HTTP-to-HTTPS `308` redirect for the production domain.
- Removed inaccessible public links to the private ecosystem-standards repository from CONTRIBUTING, SECURITY, the issue-template configuration, and the README.
- Restored the standard `.env.example` safety header.

### Fixed

- Browser and application icons now match the OpenResume brand and switch with the interface theme.

## [0.1.5] — 2026-10-18

### Changed

- OpenResume is now a session-based document builder. Resume and cover letter content survives navigation within the current session but is not restored after reload.
- Removed automatic draft persistence, draft badges, Continue Saved actions, automatic restoration, replacement confirmations, and saved-status messaging.
- New builds replace the previous document of the same type immediately, without a confirmation dialog.
- Added a lightweight application-native toast system for builds, clipboard copy, formatting reset, and PDF/Word exports.
- Copy failures and export failures use themed error toasts; structured-content errors remain inline next to the input.
- The landing page offers **Open resume** / **Open cover letter** for documents created in the current session.
- Existing `openresume:draft.v1` and `openresume:cover-letter.v1` entries are removed only when their contents validate as OpenResume documents; unrelated storage is untouched.

### Removed

- Native browser `alert` / `confirm` / `prompt` usage.
- Automatic `localStorage` document persistence and the draft persistence hooks.
- Saved-draft terminology throughout the interface.

## [0.1.4] — 2026-10-18

### Changed

- Redesigned the landing page around two substantial, independently floating document cards with generous radii, soft elevation, stronger typography, and responsive stacking.
- Updated landing copy to the new OpenResume eyebrow, headline, supporting text, and document descriptions.
- Build Resume and Build Cover Letter now always open their preparation screens, even when a saved draft exists.
- Added separate Continue Saved Resume and Continue Saved Cover Letter actions for saved drafts.
- Refined the preparation screens with a matching elevated input panel and clearer brand-home labeling.
- Saved drafts never determine the primary landing destination and are never discarded by starting a new build.

### Added

- Regression tests for build-versus-continue navigation with no drafts, one draft, and both drafts.
- Regression tests confirming that leaving preparation preserves the saved draft.

### Fixed

- A saved resume or cover letter no longer bypasses preparation when its card is selected from the landing page.

## [0.1.3] — 2026-10-18

### Added

- Document-selection landing page with borderless Build Resume and Build Cover Letter options, saved-draft indicators, and responsive layout.
- Cover letter document model, deterministic structured-text parser, fictional example, single-column layout, editor, and PDF/DOCX exports.
- Reusable AI instruction templates for resumes and cover letters, generated from the parsers' supported headings and covered by drift tests.
- Copy AI Instructions and Load Example actions on both preparation screens.
- Create matching cover letter flow with applicant identity/contact reuse and a safe return to the resume.
- Independent cover letter draft persistence under `openresume:cover-letter.v1`.
- Paragraph spacing formatting control for cover letters.
- Vercel production deployment configuration, security headers, asset caching, and deployment documentation.
- Tests for landing/navigation, cover letter parsing and exports, AI instruction compatibility, independent drafts, matching flow, migration, formatting visibility, and theme persistence.

### Changed

- The first screen is now document selection instead of a resume-only import screen.
- Preparation screens use clear Create your resume / Create your cover letter headings and remove the collapsible example format.
- The header is context-aware, with New, Format, PDF, Word, and a document label in the workspace.
- Existing v0.1.2 resume drafts load normally and gain the new paragraph-spacing default.

## [0.1.2] — 2026-10-18

### Added

- Import-first landing experience with a large paste area, prominent "Import & Preview" action, example input, and inline validation.
- Separate New and Import actions, with safe navigation back to the current resume.
- Inline SVG icon set for the header, sharing no new dependency.
- Light, dark, and system-preference theming with a far-right header toggle, persistence under `openresume-theme`, live system updates, and a pre-hydration script that prevents a flash of the wrong theme.
- Footer with OpenResume version, Kovina ecosystem attribution, GitHub, input-format, and MIT license links.

### Changed

- With no saved draft, the application opens the import screen instead of a sample-filled editor.
- Saved drafts open directly in the editor; New and Import return to the import screen without discarding the draft.
- Header actions are regrouped and relabeled: New, Import, Format, PDF, Word, Theme.
- Visual polish: refreshed spacing and radii, calmer section cards, clearer editor/preview separation, responsive header rows, and improved focus indicators.
- The editor lives in a themed shell while the resume document and both exports keep fixed colors.

### Fixed

- Header actions no longer overlap the brand on narrow screens.
- The identity row gives email more width and stacks on small screens.

## [0.1.1] — 2026-10-18

### Added

- US Letter (default), A4, and US Legal page sizes, selectable before export.
- Formatting panel for page margins, font size, line spacing, section spacing, bullet spacing, column spacing, and content density.
- Reset to Defaults action and local persistence of page size and formatting preferences.
- Page size and estimated page count in the preview header.
- Import guard that rejects text containing more than one top-level resume heading.
- "Load current draft" and "Clear" actions in the import dialog.
- Regression coverage for repeated imports, page sizes, formatting combinations, pagination, and PDF/DOCX content parity.

### Changed

- Default page size is now US Letter.
- DOCX output builds one paragraph per logical block instead of one per wrapped line, uses real Word bullets, natural line spacing, keep-with-next/keep-lines, and formatting-derived spacing.
- Headings and entry headers now stay with the next two lines of content.
- PDF page dimensions follow the selected page size.

### Fixed

- Importing a new resume no longer appends to the previous document. The import dialog starts empty, and concatenated resumes are rejected before they can be applied.
- Stale, duplicated, missing, and mixed resume content no longer flows into exports.
- DOCX text no longer appears compressed or awkwardly wrapped.
- Orphaned headings, split title/employer/date blocks, unnecessary blank pages, and truncated content are prevented.
- PDF and DOCX now carry identical content strings for the same document.

## [0.1.0] — 2026-10-18

### Added

- Deterministic structured-text parser with predefined aliases, custom sections, bullets, skill groups, and metadata lines.
- Canonical serializer with round-trip coverage.
- Two-column A4 layout engine using embedded Helvetica metrics.
- Page-aware pagination with line-boundary splitting and keep-with-next rules.
- Live, scaled preview rendered from the same layout coordinates as exports.
- Selectable-text PDF export via jsPDF.
- Editable DOCX export via docx, with one table per logical page.
- Structured editor for identity, sections, entries, and bullets.
- Local draft persistence with a versioned, validated storage key.
- Import dialog for pasting structured text.
- Fictional sample resume and input-format documentation.
- Unit, integration, component, and export tests.
- CI workflow, issue templates, and placeholder icon set.
