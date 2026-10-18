# OpenResume v0.1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a privacy-first, local-first resume builder that deterministically converts structured text into a fixed two-column resume with live page-aware preview and selectable-text PDF and editable DOCX exports.

**Architecture:** A pure pipeline: `structured text → parser → Resume model → layout engine → pages → {preview, PDF, DOCX}`. The layout engine is the single source of truth for pagination; the preview and PDF both render from the same computed page coordinates in points. React owns editor state and persistence only. No backend, no network, no AI.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Vitest + Testing Library, jsPDF (PDF), docx (DOCX), ESLint + Prettier.

**Spec:** This document (the user's v0.1.0 brief is reproduced under "Spec requirements" below). Governing standards: `/home/spars/repos/ecosystem-standards` (authoritative), with Kovina-specific standards applied where they do not conflict; MIT license.

## Spec requirements

- Name/slug: OpenResume / `openresume`; public, MIT, Kovina ecosystem; v0.1.0.
- Responsive web app, desktop-first; single-user initial audience.
- Structured text input for ChatGPT-generated resume content.
- Deterministic parsing of predefined and custom sections.
- Fixed two-column template based on a green resume reference (reference image not present in workspace; palette centralized for later replacement).
- Optional sections and configurable section ordering.
- Live, page-aware preview with editable content.
- PDF and editable DOCX exports; selectable, machine-readable text.
- Reliable pagination and overflow handling.
- Local draft persistence; no backend/auth/analytics/cloud/AI.
- Placeholder app icon per standards; replace later.
- Defer Vercel login and deployment.

## Global constraints

- License: MIT.
- Version: `0.1.0`; `0.x.0` features, `0.x.y` fixes. Update `VERSIONING.md` and `CHANGELOG.md`.
- Runtime dependencies limited to `react`, `react-dom`, `jspdf`, `docx`.
- No network calls at runtime; no telemetry; no storage except `localStorage`.
- Content is preserved exactly except where the user edits it.
- All user-facing text in sentence case; no marketing fluff.
- Exports must contain real text, never rasterized pages.
- `npm run check` must pass: lint, typecheck, test, build.
- Do not modify or audit other Kovina repositories.

## File structure

```
openresume/
├── .github/
│   ├── ISSUE_TEMPLATE/{bug_report.md,feature_request.md,config.yml}
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/ci.yml
├── .env.example                 # documents that no env vars are required
├── .gitignore
├── .prettierrc.json
├── AGENTS.md                    # agent operating notes (Kovina)
├── ARCHITECTURE.md              # canonical system design (ecosystem-standards)
├── CHANGELOG.md
├── CLAUDE.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                      # MIT
├── README.md
├── SECURITY.md
├── SUPPORT.md
├── VERSIONING.md
├── assets/
│   ├── app-icon/icon-source.png
│   ├── branding/                # placeholder notes
│   ├── hero/.gitkeep
│   └── screenshots/{dark,light,store}/.gitkeep
├── docs/
│   ├── architecture.md          # pointer/summary; ARCHITECTURE.md is canonical
│   ├── input-format.md
│   ├── maintenance.md
│   ├── privacy-model.md
│   └── superpowers/plans/2026-10-18-openresume-v0.1.0.md
├── public/{favicon.ico,icon-192.png,icon-512.png}
├── scripts/{build.sh,lint.sh,test.sh,generate-icons.py}
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles/{globals.css,tokens.css,preview.css}
│   ├── components/{AppShell,EditorPanel,SectionEditor,Preview,PageView,TextBlock,Toolbar}.tsx
│   ├── hooks/{useDraft,useDebouncedEffect}.ts
│   ├── lib/
│   │   ├── parse.ts
│   │   ├── layout.ts
│   │   ├── measure.ts
│   │   ├── paginate.ts
│   │   ├── sample.ts
│   │   ├── storage.ts
│   │   ├── exportPdf.ts
│   │   ├── exportDocx.ts
│   │   └── serialize.ts        # model ↔ input text (round-trip)
│   └── types/resume.ts
├── tests/
│   ├── parse.test.ts
│   ├── layout.test.ts
│   ├── paginate.test.ts
│   ├── storage.test.ts
│   ├── serialize.test.ts
│   ├── exportPdf.test.ts
│   ├── exportDocx.test.ts
│   └── App.test.tsx
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Core interfaces

```ts
// src/types/resume.ts
export type SectionKind =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'custom';

export type ColumnId = 'main' | 'side';

export interface ContactLink {
  label: string;
  url: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  location?: string;
  links: ContactLink[];
}

export interface ResumeHeader {
  name: string;
  headline?: string;
}

export interface ResumeItem {
  id: string;
  title?: string; // role / degree / project name / skill group
  subtitle?: string; // company / school / tech
  dateRange?: string;
  location?: string;
  bullets: string[];
  body?: string; // summary or paragraph text
}

export interface ResumeSection {
  id: string;
  kind: SectionKind;
  title: string;
  column: ColumnId;
  enabled: boolean;
  items: ResumeItem[];
}

export interface Resume {
  schemaVersion: 1;
  header: ResumeHeader;
  contact: Contact;
  summary: string; // rendered as a section in `main`
  sections: ResumeSection[];
  template: { pageSize: 'a4'; accent: string };
}

export interface ParseResult {
  resume: Resume;
  warnings: string[];
}
```

```ts
// src/lib/measure.ts
export interface FontSpec {
  sizePt: number;
  bold?: boolean;
  italic?: boolean;
}
export function measureLineWidth(text: string, font: FontSpec): number; // pt
export function wrapText(text: string, maxWidthPt: number, font: FontSpec): string[];
```

```ts
// src/lib/layout.ts
export interface PlacedLine {
  text: string;
  xPt: number;
  yPt: number;
  font: FontSpec;
  color: string;
  bullet?: boolean;
}
export interface PlacedBlock {
  sectionId: string;
  itemId?: string;
  xPt: number;
  yPt: number;
  widthPt: number;
  heightPt: number;
  lines: PlacedLine[];
}
export interface PageLayout {
  index: number;
  widthPt: number;
  heightPt: number;
  blocks: PlacedBlock[];
}
export interface Layout {
  pages: PageLayout[];
  pageWidthPt: number;
  pageHeightPt: number;
}
export function layoutResume(resume: Resume): Layout;
```

```ts
// src/lib/paginate.ts
export interface FlowBlock {
  sectionId: string;
  itemId?: string;
  kind: 'heading' | 'paragraph' | 'itemHeader' | 'bullet' | 'spacer';
  lines: MeasuredLine[]; // wrapped text + font
  keepWithNext?: boolean;
}
export function paginateColumn(blocks: FlowBlock[], capacityPt: number): FlowBlock[][];
```

Parser contract:

```ts
// src/lib/parse.ts
export function parseResume(input: string): ParseResult;
```

Storage contract:

```ts
// src/lib/storage.ts
export const DRAFT_KEY = 'openresume:draft.v1';
export function loadDraft(): Resume | null;
export function saveDraft(resume: Resume): void;
export function clearDraft(): void;
```

Export contract:

```ts
export function exportPdf(resume: Resume, layout: Layout, filename?: string): void;
export function exportDocx(resume: Resume, layout: Layout, filename?: string): Promise<Blob>;
```

## Input format (canonical)

```
# Sparsh Example
Product-minded software generalist | sparsh@example.com | +1 555 0100 | Toronto, ON | linkedin.com/in/example | github.com/example

## SUMMARY
One or two sentences of positioning. Additional lines are joined with a space.

## EXPERIENCE
### Example Company — Senior Product Engineer
2021 – Present | Toronto, ON
- Shipped a thing that mattered, with a number attached.
- Led another thing across two teams.

### Earlier Company — Software Engineer
2018 – 2021 | Remote
- Built and maintained the core system.

## EDUCATION
### Example University — B.Sc. Computer Science
2014 – 2018 | Toronto, ON

## SKILLS
Languages: TypeScript, Python, SQL
Product: Discovery, roadmapping, user research
Tools: Figma, Linear

## PROJECTS
### OpenResume
TypeScript, React, Vite
- A privacy-first resume builder.

## CERTIFICATIONS
- Example Certification — Issuer, 2024
```

Rules:

- `#` name; the first non-empty line after it is the contact/headline line split on `|`.
- `##` starts a predefined or custom section. Aliases are case-insensitive: SUMMARY/OBJECTIVE/PROFILE, EXPERIENCE/WORK/EMPLOYMENT, EDUCATION, SKILLS/TECHNICAL SKILLS, PROJECTS, CERTIFICATIONS, AWARDS, LANGUAGES, VOLUNTEER, INTERESTS.
- `###` starts an item. Supports `Title — Subtitle` (em dash or hyphen with spaces).
- The line after `###` is metadata split on `|`: first token is date range, second is location.
- `-` or `*` starts a bullet; continuation lines join the current bullet with a space.
- In SKILLS, `Label: a, b, c` becomes an item with `title: Label`, `subtitle: a, b, c`.
- In CERTIFICATIONS/AWARDS/LANGUAGES/INTERESTS, `- ...` lines become items with `body`.
- Blank lines separate blocks; structure comes from markers, not indentation.
- Unknown `##` titles become `custom` sections, preserved verbatim.
- Parser warnings never discard content.

## Tasks

### Task 1: Scaffold repository and tooling

**Files:** `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles/globals.css`, `LICENSE`, `tests/smoke.test.ts`.

- [ ] `npm create vite@latest` equivalent, React + TS template, in `/home/spars/repos/openresume`.
- [ ] Install runtime deps `jspdf`, `docx`; dev deps `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`.
- [ ] Add scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:watch`, `check`.
- [ ] Configure Vitest (`environment: 'jsdom'`, `setupFiles`, coverage on `src/lib`).
- [ ] Write MIT LICENSE (2026 Sparsh Sam).
- [ ] Verify: `npm run check` passes with the default app.

### Task 2: Types and parser (TDD)

**Files:** `src/types/resume.ts`, `src/lib/parse.ts`, `tests/parse.test.ts`.

**Produces:** `parseResume(input): ParseResult`.

- [ ] Test header + contact splitting on `|`.
- [ ] Test each predefined alias maps to the right `SectionKind`.
- [ ] Test custom `##` section preserved with `kind: 'custom'` and original title.
- [ ] Test `### Title — Subtitle`, date/location metadata, and `-` bullets.
- [ ] Test continuation lines join bullets and paragraphs.
- [ ] Test SKILLS `Label: values` parsing.
- [ ] Test empty input returns a valid empty resume and a warning, never throws.
- [ ] Test content preservation: punctuation, capitalization, em dashes unchanged.
- [ ] Implement to green; commit `feat: deterministic structured-text parser`.

### Task 3: Sample data, serializer, input-format docs

**Files:** `src/lib/sample.ts`, `src/lib/serialize.ts`, `docs/input-format.md`, `tests/serialize.test.ts`.

- [ ] Fictional sample resume covering every predefined section and one custom section.
- [ ] `serializeResume(resume): string` round-trips through `parseResume` without semantic loss.
- [ ] Round-trip property test on the sample.
- [ ] Document the format with the canonical example and edge cases.
- [ ] Commit `feat: add sample resume, serializer, and input format docs`.

### Task 4: Measurement and layout engine (TDD)

**Files:** `src/lib/measure.ts`, `src/lib/layout.ts`, `src/styles/tokens.css`, `tests/layout.test.ts`.

**Produces:** `layoutResume(resume): Layout`.

- [ ] Tokens: A4 595.28×841.89pt; margins 44pt; header block 88pt; main column 318pt; side column 145.28pt; gap 20pt; body 9.3pt/12.8pt; heading 10pt uppercase; name 23pt.
- [ ] Canvas text measurement with a cached 2D context and numeric pt-as-px units.
- [ ] Greedy word wrap that never splits a word unless it exceeds the column width.
- [ ] Build flow blocks per column from section order, skipping disabled/empty sections.
- [ ] Header consumes page 1 top; both columns start below it.
- [ ] Golden tests: known strings wrap at expected widths; column capacity respected.
- [ ] Commit `feat: add deterministic two-column layout engine`.

### Task 5: Pagination and overflow (TDD)

**Files:** `src/lib/paginate.ts`, `src/lib/layout.ts`, `tests/paginate.test.ts`.

- [ ] Atomic blocks (item header + first bullet, headings with `keepWithNext`) move together.
- [ ] Long sections split at bullet/line boundaries; no content dropped.
- [ ] Independent column pagination; page count equals max(main, side).
- [ ] Full pages render column continuation with section heading repeated.
- [ ] Test a synthetic 5-page resume: every input bullet appears exactly once.
- [ ] Commit `feat: add reliable pagination and overflow handling`.

### Task 6: Persistence and app state (TDD)

**Files:** `src/lib/storage.ts`, `src/hooks/useDraft.ts`, `src/hooks/useDebouncedEffect.ts`, `tests/storage.test.ts`, `tests/App.test.tsx`.

- [ ] Versioned key, JSON schema guard, corrupt-data fallback to sample.
- [ ] Debounced save (400ms); save on `visibilitychange`.
- [ ] Load on mount; "Reset to sample" clears storage and restores sample.
- [ ] Test save/load/clear and corrupt payload handling.
- [ ] Commit `feat: persist local drafts with versioned storage`.

### Task 7: Application shell and editor

**Files:** `src/App.tsx`, `src/components/AppShell.tsx`, `src/components/Toolbar.tsx`, `src/components/EditorPanel.tsx`, `src/components/SectionEditor.tsx`, `src/styles/globals.css`.

- [ ] Two-pane desktop layout: 380px editor rail, flexible preview; stacks below 960px.
- [ ] Toolbar: Import text (dialog), Reset sample, Export PDF, Export DOCX, status text.
- [ ] Editor: header fields, contact fields, summary textarea, section cards.
- [ ] Section card: enable toggle, title, column select, move up/down, add/remove item, bullets.
- [ ] Add custom section; section ordering controls affect layout immediately.
- [ ] Every control labeled; focus visible; 44px touch targets; no motion by default.
- [ ] Commit `feat: add accessible editor and application shell`.

### Task 8: Page-aware preview

**Files:** `src/components/Preview.tsx`, `src/components/PageView.tsx`, `src/components/TextBlock.tsx`, `src/styles/preview.css`.

- [ ] Render pages at `595.28pt × 841.89pt` with a scale-to-fit wrapper.
- [ ] Absolutely position placed lines from `Layout`; render real text, not images.
- [ ] Page labels and page count; empty-state message.
- [ ] Inline editing: click a preview text block to focus its corresponding editor field.
- [ ] Print stylesheet: one page per sheet, no browser chrome, exact colors.
- [ ] Commit `feat: add page-aware live preview`.

### Task 9: PDF export (TDD)

**Files:** `src/lib/exportPdf.ts`, `tests/exportPdf.test.ts`.

- [ ] jsPDF unit `pt`, format `a4`, Helvetica; draw from `Layout` coordinates.
- [ ] Selectable text; accent section headings; bullets; link annotations for email/URLs.
- [ ] Page count matches `layout.pages.length`; filename `{Name}-Resume.pdf` sanitized.
- [ ] Test: output starts with `%PDF`; text-draw calls include every bullet; page count.
- [ ] Commit `feat: add selectable-text PDF export`.

### Task 10: DOCX export (TDD)

**Files:** `src/lib/exportDocx.ts`, `tests/exportDocx.test.ts`.

- [ ] `docx` Document, no-border two-column table per logical page, page breaks between.
- [ ] Real editable paragraphs; heading styles; bullets as paragraphs with `•`.
- [ ] Metadata title/author; filename `{Name}-Resume.docx`.
- [ ] Test: non-empty blob; `document.xml` contains header name and every bullet.
- [ ] Commit `feat: add editable DOCX export`.

### Task 11: Repository documentation and metadata

**Files:** `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, `VERSIONING.md`, `CHANGELOG.md`, `CLAUDE.md`, `AGENTS.md`, `docs/{architecture.md,maintenance.md,privacy-model.md}`, `.env.example`.

- [ ] README: title, description, status, screenshots placeholder, features, stack, local-first/privacy statement, development, license.
- [ ] ARCHITECTURE.md: pipeline diagram, module boundaries, invariants, dependency policy.
- [ ] VERSIONING.md: SemVer policy from the brief (`0.x.0` features, `0.x.y` fixes).
- [ ] CHANGELOG with `0.1.0` entry.
- [ ] CLAUDE.md + AGENTS.md referencing ecosystem-standards and the Kovina standards URL.
- [ ] Privacy model: no network, no telemetry, localStorage only.
- [ ] Commit `docs: add repository documentation and metadata`.

### Task 12: CI, templates, icon, final validation

**Files:** `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`, `scripts/*`, `assets/app-icon/icon-source.png`, `public/favicon.ico`, `public/icon-{192,512}.png`.

- [ ] CI: Node 22, `npm ci`, lint, typecheck, test, build; upload `dist` artifact.
- [ ] Issue/PR templates adapted from ecosystem-standards.
- [ ] Generate placeholder icon with PIL: deep-green rounded square, white résumé glyph, 1024²; favicons 32/180/192/512 and `favicon.ico`.
- [ ] Scripts wrap npm commands with `--help`.
- [ ] `npm run check` green; `npm run build` produces `dist/`.
- [ ] Manual verification: parse sample → edit → paginate → PDF text selection → DOCX opens.
- [ ] Commit `chore: add CI, templates, placeholder icon, and release checks`.

## Verification matrix

| Requirement               | Verification                                             |
| ------------------------- | -------------------------------------------------------- |
| Deterministic parsing     | Unit tests on aliases, custom sections, preservation     |
| Optional/ordered sections | Editor toggles/order change layout in tests and manually |
| Page-aware preview        | Snapshot of page count + manual resize check             |
| Pagination/overflow       | Every bullet appears exactly once across pages           |
| PDF text                  | `%PDF` header + text draw calls + manual selection       |
| DOCX editable             | `document.xml` text assertions + manual open             |
| Local persistence         | storage tests + reload manual check                      |
| No backend/network        | dependency audit + `grep` for fetch/axios; no env vars   |
| Accessibility             | labeled controls, keyboard pass, contrast, focus         |

## Assumptions and open items

- The green reference image was not present in the workspace. Palette tokens use a deep forest green (`#14532D`) and are centralized in `src/styles/tokens.css` for one-line replacement.
- A4 only in v0.1.0; Letter can be added without changing the pipeline.
- GitHub repository creation/push is deferred until explicit permission, per standing instruction.
- Vercel login and deployment deferred as directed.
