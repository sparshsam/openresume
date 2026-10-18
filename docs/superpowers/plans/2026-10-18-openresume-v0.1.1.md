# OpenResume v0.1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a document-quality release that fixes mixed-content imports, improves DOCX readability, adds three page sizes and a formatting panel, strengthens pagination, and verifies PDF/DOCX parity.

**Architecture:** Keep the existing pipeline. Extend `Resume.template` with a page size and format settings; add a pure `resolveMetrics()` that turns presets into all geometry, typography, and spacing values; make the existing layout engine, preview, PDF, and DOCX consume those metrics. Fix the import path at its source: the dialog starts empty, imports replace the whole document, and multiple top-level headings are rejected.

**Tech Stack:** React 19, TypeScript 5/6, Vite 8, Vitest, jsPDF, docx, JSZip (test-only).

**Spec:** This document plus the user's v0.1.1 brief (content integrity, DOCX readability, page sizes, formatting controls, pagination, UX, QA, release).

## Global Constraints

- Preserve the architecture, UI identity, template, and design tokens.
- No new runtime dependencies. `jszip` is test-only.
- No AI, auth, cloud storage, or additional templates.
- Default page size: US Letter (8.5×11 in). Also A4 and US Legal (8.5×14 in).
- PDF text stays selectable; DOCX stays editable.
- No push or deployment.
- Version `0.1.1`; update CHANGELOG and docs.
- `npm run check` and `npm run format:check` must pass.

## Confirmed root cause of mixed content

The import dialog was initialized with `serializeResume(resume)`. Pasting a new resume appended it to the old text. The parser kept the first `#` name, ignored the second, and merged the new body into the old document. The mixed state persisted and flowed into both exports.

**Fix:** open the dialog empty; add an explicit "Load current draft" action; reject inputs with more than one top-level `#` heading; replace the whole document on apply; preserve only the formatting template.

## New types (`src/types/resume.ts`)

```ts
export type PageSize = 'letter' | 'a4' | 'legal';
export type MarginPreset = 'narrow' | 'normal' | 'wide';
export type FontSizePreset = 'small' | 'standard' | 'large';
export type SpacingPreset = 'compact' | 'standard' | 'relaxed';
export type ColumnSpacingPreset = 'narrow' | 'standard' | 'wide';
export type DensityPreset = 'compact' | 'balanced' | 'spacious';

export interface FormatSettings {
  margins: MarginPreset;
  fontSize: FontSizePreset;
  lineSpacing: SpacingPreset;
  sectionSpacing: SpacingPreset;
  bulletSpacing: SpacingPreset;
  columnSpacing: ColumnSpacingPreset;
  density: DensityPreset;
}

export interface ResumeTemplate {
  pageSize: PageSize;
  accent: string;
  format: FormatSettings;
}

export const DEFAULT_FORMAT: FormatSettings = {
  margins: 'normal',
  fontSize: 'standard',
  lineSpacing: 'standard',
  sectionSpacing: 'standard',
  bulletSpacing: 'standard',
  columnSpacing: 'standard',
  density: 'balanced',
};

export const DEFAULT_TEMPLATE: ResumeTemplate = {
  pageSize: 'letter',
  accent: '#14532D',
  format: DEFAULT_FORMAT,
};
```

`ParseResult` gains `documentCount: number`.

## Metrics (`src/lib/metrics.ts`)

```ts
export interface ResolvedMetrics {
  pageWidthPt: number;
  pageHeightPt: number;
  pageSizeLabel: string;
  marginXPt: number;
  marginTopPt: number;
  marginBottomPt: number;
  contentWidthPt: number;
  mainWidthPt: number;
  sideWidthPt: number;
  gapPt: number;
  namePt: number;
  nameLinePt: number;
  headlinePt: number;
  headlineLinePt: number;
  bodyPt: number;
  bodyLinePt: number;
  smallPt: number;
  smallLinePt: number;
  headingPt: number;
  headingLinePt: number;
  sectionBeforePt: number;
  sectionAfterPt: number;
  itemBeforePt: number;
  paragraphAfterPt: number;
  bulletAfterPt: number;
  densityFactor: number;
}

export function resolveMetrics(template: ResumeTemplate): ResolvedMetrics;
```

| Preset               | Values                                                         |
| -------------------- | -------------------------------------------------------------- |
| Pages                | letter 612×792; a4 595.28×841.89; legal 612×1008               |
| Margins              | narrow 28/30/30; normal 44/40/40; wide 58/52/52 (x/top/bottom) |
| Font scale           | small 0.93; standard 1.0; large 1.08                           |
| Line factor          | compact 1.22; standard 1.37; relaxed 1.52                      |
| Column gap           | narrow 14; standard 22; wide 32                                |
| Density              | compact 0.82; balanced 1.0; spacious 1.22                      |
| Section before/after | compact 10/3; standard 14/4; relaxed 19/6 (× density)          |
| Bullet after         | compact 0.5; standard 1.2; relaxed 2.6 (× density)             |
| Item before          | 7 × density                                                    |
| Paragraph after      | 3 × density                                                    |

Columns: `contentWidth = pageWidth - 2×marginX`; `mainWidth = contentWidth × 0.6308`; `sideWidth = contentWidth - mainWidth - gap`. Clamp `sideWidth` to at least 100 pt by shrinking the gap first.

## Tasks

### Task 1: Content integrity fix (TDD)

**Files:** `src/lib/parse.ts`, `src/components/ImportDialog.tsx`, `src/App.tsx`, `tests/parse.test.ts`, `tests/App.test.tsx`.

**Produces:** `parseResume` returns `documentCount`; import dialog starts empty; apply replaces the whole document.

- [ ] Test: two `#` headings produce `documentCount === 2` and a warning; one produces `1`.
- [ ] Test: import A, reopen import, enter B, apply → preview has B and not A; storage contains only B.
- [ ] Test: concatenated A+B is rejected with an error and leaves the document unchanged.
- [ ] Implement `documentCount` and a blocking error in the dialog.
- [ ] Replace `initialText` with `currentText` plus "Load current draft" and "Clear" actions.
- [ ] Commit `fix: make imports replace the whole document`.

### Task 2: Types, defaults, and metrics resolver (TDD)

**Files:** `src/types/resume.ts`, `src/lib/metrics.ts`, `tests/metrics.test.ts`, `tests/storage.test.ts`.

- [ ] Test all three page dimensions and labels.
- [ ] Test every preset changes its intended metric and leaves others stable.
- [ ] Test density composes with individual spacing rather than overriding it.
- [ ] Test column widths remain valid for every page/margin/gap combination.
- [ ] Test old drafts without `format` normalize to defaults while preserving an existing page size.
- [ ] Implement types, defaults, `resolveMetrics`, and `normalizeResume` in storage.
- [ ] Commit `feat: add page size and formatting metrics`.

### Task 3: Layout engine consumes metrics

**Files:** `src/lib/layout.ts`, `src/lib/tokens.ts`, `tests/layout.test.ts`.

- [ ] Replace hard-coded `PAGE`/`MARGIN`/`COLUMNS` use with `resolveMetrics`.
- [ ] Compute header height from font metrics and wrapped contact lines.
- [ ] Attach `kind` to every flow block: `heading | title | subtitle | meta | body | bullet | listItem | skillLabel | skillValue`.
- [ ] Add metrics and page-size label to `Layout`.
- [ ] Test each page size renders inside its bounds and uses the right column geometry.
- [ ] Test font size, margins, line spacing, section spacing, bullet spacing, column gap, and density each alter the expected measurement.
- [ ] Commit `feat: drive layout from formatting metrics`.

### Task 4: Pagination hardening

**Files:** `src/lib/paginate.ts`, `tests/paginate.test.ts`, `tests/layout.test.ts`.

- [ ] Keep headings with the next block plus its first two lines.
- [ ] Keep title, subtitle, and metadata chained together.
- [ ] Test a heading near the page bottom moves to the next page with its content.
- [ ] Test no fully blank pages and no trailing blank page.
- [ ] Test every bullet/paragraph survives across all page sizes with a long resume.
- [ ] Commit `fix: prevent orphan headings and blank pages`.

### Task 5: Preview and PDF respect page size

**Files:** `src/components/Preview.tsx`, `src/components/PageView.tsx`, `src/lib/exportPdf.ts`, `tests/exportPdf.test.ts`.

- [ ] Preview uses `layout.pageWidthPt/pageHeightPt`; meta shows size label, page count, and scale.
- [ ] PDF uses `format: [width, height]` and matching `addPage`.
- [ ] Test PDF page dimensions for Letter, A4, and Legal.
- [ ] Test PDF content parity for ASCII fixtures.
- [ ] Commit `feat: support Letter, A4, and Legal in preview and PDF`.

### Task 6: DOCX readability rewrite

**Files:** `src/lib/exportDocx.ts`, `tests/exportDocx.test.ts`.

- [ ] Build one paragraph per logical block, not per wrapped line.
- [ ] Use Word bullets for bullet/list blocks; merge continuation lines.
- [ ] Apply heading/title/meta/body spacing, `keepNext`, `keepLines`, and natural line spacing (240/276/330).
- [ ] Use metrics for page size, margins, and table widths.
- [ ] Test page size XML, merged bullet text, `keepNext`, and content parity.
- [ ] Commit `fix: make DOCX readable and editable`.

### Task 7: Formatting panel and persistence

**Files:** `src/components/FormattingPanel.tsx`, `src/components/Toolbar.tsx`, `src/App.tsx`, `src/lib/resumeEdits.ts`, `src/styles/globals.css`, `tests/App.test.tsx`.

- [ ] Add a compact disclosure panel with eight selects and Reset to Defaults.
- [ ] Page size, margins, font size, line spacing, section spacing, bullet spacing, column spacing, density.
- [ ] Persist via `Resume.template`; preserve template across imports and sample resets.
- [ ] Display page size and estimated page count in the preview meta.
- [ ] Test a control changes the preview, reset restores defaults, and settings persist after reload.
- [ ] Commit `feat: add document formatting controls`.

### Task 8: Parity and QA suite

**Files:** `src/lib/content.ts`, `tests/contentParity.test.ts`, `tests/exportPdf.test.ts`, `tests/exportDocx.test.ts`.

- [ ] Add `collectContentStrings(resume)`.
- [ ] Test PDF and DOCX document.xml contain every string for short, standard, and long ASCII resumes.
- [ ] Test text extraction and absence of images in PDF.
- [ ] Test repeated imports leave only the newest content in both export pipelines.
- [ ] Commit `test: verify document content parity`.

### Task 9: Release v0.1.1

**Files:** `package.json`, `CHANGELOG.md`, `README.md`, `ARCHITECTURE.md`, `docs/maintenance.md`.

- [ ] Bump version to `0.1.1`.
- [ ] Document page sizes, formatting controls, import integrity, DOCX behavior.
- [ ] Run `npm run format`, `npm run format:check`, `npm run check`.
- [ ] Manually verify all three page sizes and both exports.
- [ ] Commit `chore(release): v0.1.1`.

## QA matrix

| Area        | Cases                                                            |
| ----------- | ---------------------------------------------------------------- |
| Imports     | fresh import, repeated import, concatenated resumes, empty input |
| Page sizes  | Letter, A4, Legal — preview bounds, PDF dimensions, DOCX pgSz    |
| Formatting  | each control individually, combined extremes, reset              |
| Content     | short, standard, long; bullets, paragraphs, custom sections      |
| Pagination  | orphan heading, title chain, blank pages, every line once        |
| Exports     | PDF text selectable, no images; DOCX editable, merged paragraphs |
| Persistence | format survives reload, import, and reset                        |
