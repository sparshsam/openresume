# Changelog

All notable changes to this project will be documented in this file.

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
