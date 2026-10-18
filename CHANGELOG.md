# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Vercel production deployment configuration (`vercel.json`) with security headers and asset caching.
- Deployment documentation and the production URL in the README.

### Changed

- No runtime changes; the application remains v0.1.2.

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
