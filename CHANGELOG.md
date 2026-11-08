# Changelog

All notable changes to this project will be documented in this file.

## [0.2.1] — 2026-11-08

### Added

- **Eight genuinely redesigned résumé compositions.** Executive, Modern Minimal, Classic, Creative, Compact, Academic, Contemporary, and Bold now differ structurally, not just in type and colour: centered or split or banner identity blocks, left and right tinted rails, bar and filled and framed section headings, dates aligned beside titles, and an academic date gutter. Professional Two-Column and ATS Simple are unchanged.
- **Structural design primitives.** A design now declares a page arrangement (`linear`, `balanced`, `sidebarLeft`, `sidebarRight`), an identity variant (`stacked`, `centered`, `split`, `banner`, `compact`), a section-heading decoration (`none`, `underline`, `trailing`, `bar`, `fill`, `topRule`, `boxed`), an entry layout (`stacked`, `titleRow`, `gutter`), and a sidebar tint/divider. The layout resolves these into the same absolute-positioned block model consumed by the preview, PDF, and DOCX.
- **Compact Format workspace drawer.** **Format** now opens a fixed, non-modal drawer with **Designs** and **Formatting** tabs instead of pushing an oversized gallery into the page. Designs are shown as compact, proportional SVG thumbnails in a responsive grid; formatting controls are grouped under Page, Typography, and Spacing, with a persistent reset footer. The drawer closes with its button or Escape, restores focus to the Format button, supports arrow-key tab navigation, and becomes a full-screen sheet under 720 px. The résumé preview stays visible while designs are browsed.
- **Defensive contact-line parsing.** Email, phone, and links are classified by shape, so an omitted field never shifts later values. Free text is accepted as a location only when it validates as a verified geographic place or confirmed arrangement and does not read as a job title, employer, or professional headline. Entry metadata after `|` is validated the same way. Rejected values produce warnings instead of silently occupying Location.
- **An explicit AI contact contract.** All three templates share five field roles (professional headline, target job title, employment job title, employer, geographic location), one canonical contact-line structure, an omit-the-part rule, valid and invalid location examples, and five published examples covering a missing headline, missing location, missing phone, and multiple links.
- **Regression coverage** for malformed AI résumés, cover letters, and application kits; structural composition and content preservation across all ten designs; thumbnail accuracy; PDF/DOCX rendering of bands, rules, gutters, and tab-aligned rows; and the Format drawer.

### Changed

- Contact and entry location warnings now appear in the build warnings shown after preparation.
- The design registry exposes arrangement, header, heading, entry, and sidebar traits. Cover-letter styles keep their existing four treatments.
- Version bumped to 0.2.1.

### Tests

- 529 tests across 38 files, including the new `aiFieldPlacement`, `designComposition`, `designThumbnail`, `exportDesigns`, and `formattingDrawer` suites.

## [0.2.0] — 2026-11-02

### Added

- **Ten résumé designs.** Professional Two-Column (default) and ATS Simple are joined by Executive, Modern Minimal, Classic, Creative, Compact, Academic, Contemporary, and Bold. Each design composes the same shared block, measurement, pagination, and export primitives with its own column count, font family, header treatment, section-heading treatment, and spacing scale. Switching designs preserves every section, entry, field, bullet, and formatting value, and never touches the source text or the document model.
- **Browse Designs gallery.** An accessible radio gallery replaces the résumé layout dropdown. Each design card shows a locally rendered SVG thumbnail of the same fictional sample, its name, a short description, and a selected state. Native radio semantics provide keyboard selection, and the grid stacks to one column on narrow screens.
- **Four cover-letter styles.** Classic Letter (default), Modern Letter, Executive Letter, and Minimal Letter are selectable independently. When a résumé design is chosen, the cover-letter panel suggests a coordinated style without applying it.
- **Application-context recommendations.** An optional context selector highlights suggested résumé designs for government/legal, corporate/management, technology/business, creative/marketing, and experienced-professional applications. Recommendations are informational, never automatic, and make no claims about hiring outcomes.
- **Pagination controls.** Section headings are always kept with their first entry, whole entries move to the next page when they fit there, and any section can be set to start on a new page. Automatic pagination remains the default; an entry taller than a page still flows across pages without clipping.
- **Drag-and-drop section ordering.** A drag handle on every section card complements the existing up/down buttons. Keyboard users keep the buttons as the accessible ordering path, and stored column assignments are never changed by reordering.
- **Live page counts.** The workspace header shows the active document's page count, and the Application Kit toolbar shows both counts independently (for example, `Resume: 2 pages | Cover Letter: 1 page`). Counts update with content, formatting, pagination settings, and design changes.

### Changed

- Résumé layout and visual styling are now separate from content and measurement: a design registry supplies column count, font family, header and heading treatments, and spacing scales, and `resolveMetrics` composes those with the existing formatting presets. PDF and DOCX exports read the same `Layout` plus design traits; no exporter was duplicated.
- Times (PDF standard font) and Times New Roman (Word) join Helvetica for serif designs. Both are deterministic, viewer-available fonts; no external font files or image requests are introduced.
- DOCX output now carries header rules, section-heading rules, letter spacing, and aligned headers from the active design.

### Compatibility

- Input formats and AI instructions are unchanged.
- Existing templates without the new fields normalize to Professional Two-Column, Classic Letter, and keep-entries-together pagination.
- ATS Simple keeps its single-column author-order reading flow, table-free DOCX output, and no-compatibility-guarantee note.
- 95 new tests (444 total across 33 files) cover design switching, content preservation, gallery selection, section ordering, pagination, page counts, cover-letter styles, and PDF/DOCX output.

## [0.1.13] — 2026-11-02

### Fixed

- **The workspace opens at the top.** Building a resume, cover letter, or application kit now resets the page and the workspace's own scroll areas before the workspace paints. Previously the document retained the preparation screen's scroll offset, so the workspace could open part-way down. Browser scroll restoration is turned off while the app is mounted, and focus outside the workspace is released before the reset so it cannot scroll the new view.
- **AI instructions no longer produce job titles as locations.** All three instruction templates now define the professional headline, job title, employer name, and geographic location explicitly, forbid a job title, employer, or headline in a location slot, and require an unverified location to be omitted rather than substituted or invented. The resume and cover letter examples use a headline that is distinct from the example job title, and the resume example shows a date-only metadata line for an entry without a location.

### Changed

- Version bumped to 0.1.13.

## [0.1.12] — 2026-10-21

### Fixed

- The header brand mark and favicons now use the light artwork in both interface themes. The near-black `*-dark.png` variants were hard to read against the light interface.
- The initial favicon links in every HTML shell and the pre-hydration theme script now point at the light artwork, so the correct icons show before React mounts as well as after a theme switch.

### Changed

- The dark icon variants remain generated and shipped for application icons and social cards, but the in-app header and favicons no longer switch with the theme.
- `theme-color` still follows the interface theme.
- Version bumped to 0.1.12.

## [0.1.11] — 2026-10-21

### Added

- **Application Kit document order.** The kit toolbar now offers **Cover Letter → Resume** (default) and **Resume → Cover Letter**. The choice applies to both the combined PDF and the combined Word document, preserving each document's page sizes, page breaks, formatting, accent, and selectable/editable text. The setting is session-only and is never stored.
- **ATS Simple resume layout.** A second resume template with a single full-width column, linear section reading order, standard section headings, and no tables or positioned columns. The combined Word export emits it as a plain paragraph flow with no table cells. Accent colours, page sizes, formatting presets, resume editing, and the Application Kit all work unchanged.
- **Resume layout control** in the formatting panel. **Column spacing** is hidden while ATS Simple is active because a single-column template has no column gap.

### Changed

- Secondary text (contact lines, dates, locations) is now set at 8.8 pt with more generous leading, and the muted document colour is darker for stronger contrast on white.
- Section spacing and experience-entry spacing are slightly more generous at every preset, giving sections and roles clearer separation while keeping the sample resume on one page in the professional two-column layout.
- Version bumped to 0.1.11.

### Compatibility

- Existing templates without a `layout` field normalize to **Professional Two-Column**, so the default output is unchanged in structure.
- 50 new regression tests cover layout normalization, single-column geometry, reading order, content preservation across templates, PDF and DOCX text extraction, page breaks, document ordering, page sizes, accents, typography, and cross-format consistency.
- ATS Simple reduces common parsing obstacles; it does not guarantee compatibility with any specific applicant tracking system.

## [0.1.10] — 2026-10-21

### Fixed

- **Load Example** on the Application Kit preparation screen now inserts the combined resume-and-cover-letter sample instead of the standalone cover letter example.
- The loaded kit sample uses both required delimiters and parses successfully without validation errors.
- The resume and cover letter samples remain correct on their standalone preparation screens.

### Changed

- The Application Kit AI instructions and Load Example now share one canonical combined sample, so the two cannot drift.
- Version bumped to 0.1.10.

### Documentation

- Corrected the README limitation that still described the application icon as a placeholder; the generated light and dark branding assets are already in use.

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
