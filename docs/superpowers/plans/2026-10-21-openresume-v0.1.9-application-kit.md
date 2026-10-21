# OpenResume v0.1.9 — Application Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class Application Kit workflow that builds a tailored resume and matching cover letter together from one delimited AI response, edits both in a tabbed workspace, and exports combined or separate files.

**Architecture:** The kit is an orchestration layer over the existing models, parsers, editors, layouts, and exporters. App keeps one `resume` and one `coverLetter` model plus `kitBuilt` and `workspaceMode` flags; the kit never duplicates document content. A dedicated `parseApplicationKit` splits one delimited text into two existing-parser inputs and validates atomically before any state changes.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, jsPDF, docx.

**Spec:** The v0.1.9 Application Kit brief supplied by Sparsh on 2026-10-20.

## Global Constraints

- Reuse existing parsers, editors, layouts, formatting, accents, and export engines.
- No new runtime dependencies; no backend, network, telemetry, AI service, or document persistence.
- One `Layout` per document; never re-paginate in an exporter.
- Exactly one enclosing code fence remains a delivery container.
- Atomic kit build: validate both documents before replacing either model.
- `main` protected: feature branch `feature/application-kit`, PR, green `check`, no bypass.
- Version `0.1.9`; annotated tag and GitHub pre-release.

## Review Focus

- Copy buttons on the stretched card link must not trigger card navigation.
- Kit build failure must leave both previous documents untouched.
- Delimiter parsing must never guess boundaries when order, count, or emptiness is wrong.
- Cross-document name/contact mismatch must warn, never rewrite.
- Combined PDF must start the resume on a new page even when page sizes differ.
- Combined DOCX must use a page break or a Word section break, never a ZIP concatenation.
- Tab switching must preserve edits and independent formatting per document.

---

### Task 1: Types, kit instructions, clipboard helper

**Files:** `src/types/document.ts`, `src/lib/aiInstructions.ts`, `src/lib/aiClipboard.ts`, `tests/aiInstructions.test.ts`

- [ ] Add `PrepareKind = DocumentKind | 'applicationKit'` and `WorkspaceMode = 'single' | 'kit'`.
- [ ] Write failing tests for `APPLICATION_KIT_AI_INSTRUCTIONS`: one code block, both delimiters documented in order, all resume and cover letter aliases, no unsupported headings, Canadian English, conflict handling.
- [ ] Implement the template and fenced example using the existing alias groups; extend `getAiInstructions(kind: PrepareKind)`.
- [ ] Add `copyAiInstructions(kind)` returning success/failure; use it from the UI in Task 4.

### Task 2: Combined parser

**Files:** `src/lib/parseApplicationKit.ts`, `tests/parseApplicationKit.test.ts`

- [ ] Write failing tests: valid raw, valid fenced, missing delimiter, duplicate delimiter, reversed order, empty sections, missing names, malformed fence, content before the first delimiter, cross-document name/contact warnings.
- [ ] Implement an orchestration layer only: strip one enclosing fence, split on exact delimiters, validate order/count/emptiness, call `parseResume` and `parseCoverLetter`, enforce one document heading per section, require a cover letter body, collect warnings.
- [ ] Return a discriminated union: `{ ok: true, resume, coverLetter, warnings }` or `{ ok: false, errors }`.

### Task 3: Homepage

**Files:** `src/components/LandingPage.tsx`, `src/components/Icon.tsx`, `src/styles/globals.css`, `tests/App.test.tsx`

- [ ] Write failing tests: three cards; all three Copy buttons call the clipboard; copy does not navigate; existing Build/Open actions still work; third card text and actions.
- [ ] Add a `files` inline SVG icon; add third card; add Copy AI Instructions to every card with `position: relative; z-index: 1` above the stretched action; keep the card overlay behaviour.
- [ ] Three-column desktop grid, two columns at tablet widths, one column at 760px; no horizontal overflow.

### Task 4: Kit preparation

**Files:** `src/components/PrepareScreen.tsx`, `tests/App.test.tsx`

- [ ] Write failing tests: kit title, textarea label, six-step workflow ending “Build both documents.”, copy feedback, parse errors shown inline, successful build opens the kit workspace.
- [ ] Extend `PrepareScreen` with `PrepareKind` labels/placeholder and `onBuildApplicationKit`; keep standalone behaviour unchanged.

### Task 5: App state, tabs, and header

**Files:** `src/App.tsx`, `src/components/ApplicationKitToolbar.tsx`, `src/components/Header.tsx`, `src/styles/globals.css`, `tests/App.test.tsx`

- [ ] Write failing tests: kit build sets both documents and kit mode; failed build preserves previous models; tabs switch without losing edits; accent and formatting remain independent; Open Application Kit appears only after a kit build; navigation preserves both.
- [ ] Add `kitBuilt` and `workspaceMode`; separate `prepareKind`; atomic build handler; memoized per-document layouts; kit toolbar with accessible tabs (arrow/Home/End) and export actions; header shows “Application Kit”, New starts a new kit, and header exports are hidden in kit mode.
- [ ] Render the active document with the existing editors and preview inside a `role="tabpanel"`.

### Task 6: Combined exports

**Files:** `src/lib/exportPdf.ts`, `src/lib/exportDocx.ts`, `src/lib/filename.ts`, `tests/exportPdf.test.ts`, `tests/exportDocx.test.ts`

- [ ] Write failing tests: combined PDF has both documents, cover letter first, resume on a new page, selectable text, differing page sizes; combined DOCX has both documents in order, a page break (same geometry) or a `nextPage` section (different geometry), and existing standalone exports unchanged.
- [ ] Refactor PDF page drawing into a reusable function; add `exportCombinedPdf`.
- [ ] Refactor DOCX child building; add `exportApplicationKitDocx` with a single section plus explicit page break when geometry matches, otherwise two sections with `SectionType.NEXT_PAGE`.
- [ ] Add `applicationKitFilename`.

### Task 7: Documentation and version

**Files:** `CHANGELOG.md`, `README.md`, `src/components/InfoPages.tsx`, `docs/*.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`, `package.json`, `package-lock.json`, `src/lib/appMeta.ts`

- [ ] Bump to `0.1.9` with `npm version 0.1.9 --no-git-tag-version`; update the `appMeta` fallback.
- [ ] Document the combined format, delimiters, validation, tabs, exports, and privacy model. Correct the pre-existing input-format “confirmation” drift. Update About features.
- [ ] Run format, lint, typecheck, tests, and build.

### Task 8: Protected workflow and publication

- [ ] Branch `feature/application-kit`, commit, push, open PR, wait for `check`, review diff, merge.
- [ ] Annotated tag `v0.1.9`, GitHub pre-release, confirm Vercel production deployment.
- [ ] Production QA: three cards, three copies, standalone workflows, kit workflow, tabs, combined PDF/DOCX, separate downloads, themes, accents, session-only behaviour, info pages, mobile, exports inspection, no console errors or external requests.

## Self-Review

- Spec coverage: Phases 2–3 → Task 3; 4 → Task 1; 5 → Task 2; 6 → Tasks 4–5; 7 → Task 5; 8 → Task 6; 9 → Tasks 5–6; 10 → every task’s tests; 11 → Task 7; 12–14 → Task 8.
- Types: `PrepareKind` and `WorkspaceMode` are the only new unions; `DocumentKind` stays unchanged so layouts and filenames remain compatible.
- No document model duplication; one resume and one cover letter remain authoritative.
