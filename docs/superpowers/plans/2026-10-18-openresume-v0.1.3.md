# OpenResume v0.1.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend OpenResume from a resume-only app into a dual-purpose resume and cover letter builder with a document-selection landing page, shared preparation workflow, reusable AI instructions, independent drafts, and a single-column letter engine.

**Architecture:** Keep the existing pure pipeline. Add `CoverLetter` as a second document model with its own parser, layout, editor, and exports. Both documents share contact parsing, metrics, pagination, preview components, PDF drawing helpers, DOCX paragraph helpers, theme, and the Kovina footer. App state becomes `landing | prepare | workspace` with an `activeKind` of `resume | coverLetter`; resume and cover letter drafts persist under separate keys.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, jsPDF, docx. No new dependencies.

**Spec:** This document plus the user's v0.1.3 brief (landing, shared workflow, input screens, AI instructions, examples, cover letter workspace, resume-to-letter flow, navigation/state, header/footer, QA, release).

## Global Constraints

- Preserve the resume parser, editor, template, layout, exports, formatting, themes, and visual identity.
- No authentication, database, analytics, cloud storage, external AI services, or new dependencies.
- Cover letter format is single-column; resume stays two-column.
- Independent local drafts: resume `openresume:draft.v1`, cover letter `openresume:cover-letter.v1`.
- Never silently overwrite a document. Confirm replacement when a draft exists.
- AI instructions are generated from parser constants and tested against them.
- Exports contain selectable, machine-readable text.
- Version `0.1.3`; commit locally; **do not push or deploy**.
- `npm run check` and `npm run format:check` must pass.

## Review Focus

1. A cover letter with most optional fields omitted must render a valid letter without blank blocks or blank pages.
2. Pasting a resume into the cover-letter prep (or vice versa) must fail with a clear error, never produce a malformed document.
3. Creating a matching cover letter must not modify the resume, and must not overwrite an existing cover letter without confirmation.
4. The AI instructions must mention every parser alias; drift breaks the primary workflow.
5. Formatting controls irrelevant to a document type must be hidden, and changing one document's formatting must not alter the other's.

## File structure

```
src/
├── types/
│   ├── document.ts                 DocumentKind
│   ├── resume.ts                   + paragraphSpacing in FormatSettings
│   └── coverLetter.ts              CoverLetter, CoverLetterParseResult
├── lib/
│   ├── contact.ts                  shared contact-line parser
│   ├── parse.ts                    refactored to use contact.ts
│   ├── parseCoverLetter.ts         cover letter parser + aliases
│   ├── coverLetterEdits.ts         pure edit helpers
│   ├── coverLetterLayout.ts        single-column layout
│   ├── aiInstructions.ts           templates + examples + getAiInstructions
│   ├── coverLetterSample.ts        fictional example
│   ├── content.ts                  + cover letter content strings
│   ├── documentMeta.ts             metadata + filenames
│   ├── exportPdf.ts                shared PDF drawing for both
│   ├── exportDocx.ts               shared paragraph helpers + letter document
│   ├── metrics.ts                  + paragraphSpacingPt
│   ├── normalize.ts                + paragraphSpacing + cover letter template
│   └── storage.ts                  + cover letter draft
├── hooks/
│   ├── usePersistedDocument.ts     generic draft hook
│   ├── useDraft.ts                 resume wrapper
│   └── useCoverLetterDraft.ts      cover letter wrapper
├── components/
│   ├── LandingPage.tsx
│   ├── PrepareScreen.tsx           replaces ImportScreen
│   ├── CoverLetterEditor.tsx
│   ├── TextField.tsx               extracted shared field
│   ├── Header.tsx                  + kind label, home, no Import
│   ├── FormattingPanel.tsx         + kind-aware controls
│   ├── Preview.tsx / PageView.tsx  unchanged, reused
│   └── Icon.tsx                    + mail/pen icons
├── App.tsx                         landing/prepare/workspace + both docs
└── styles/globals.css              landing/prepare/letter editor styles
```

## Task 1: Shared contact parsing and formatting schema

**Files:** `src/lib/contact.ts`, `src/lib/parse.ts`, `src/types/resume.ts`, `src/lib/normalize.ts`, `src/lib/metrics.ts`, tests.

**Interfaces:**

- `parseContactLine(line: string): { headline?: string; contact: Contact }`
- `FormatSettings` gains `paragraphSpacing: SpacingPreset`
- `ResolvedMetrics` gains `paragraphSpacingPt: number` (compact 4, standard 8, relaxed 14, × density)

- [ ] Test: resume parser behavior is unchanged after extracting `parseContactLine` (email/phone/location/links/headline).
- [ ] Test: `normalizeFormat({})` includes `paragraphSpacing: 'standard'`; legacy drafts missing it normalize to standard.
- [ ] Test: `resolveMetrics` paragraph spacing composes with density and changes independently of section/bullet spacing.
- [ ] Implement the shared parser and schema; keep `DEFAULT_FORMAT` / `DEFAULT_TEMPLATE` as the single defaults.
- [ ] Commit `refactor: share contact parsing and add paragraph spacing`.

## Task 2: Cover letter model, parser, example, and AI instructions

**Files:** `src/types/coverLetter.ts`, `src/lib/parseCoverLetter.ts`, `src/lib/coverLetterSample.ts`, `src/lib/aiInstructions.ts`, `tests/parseCoverLetter.test.ts`, `tests/aiInstructions.test.ts`.

**Produces:**

- `CoverLetter` with `applicant {name, headline?, contact}`, `date`, `recipient: string[]`, `position`, `salutation`, `body: string[]`, `closing`, `signature`, `template`.
- `parseCoverLetter(input): { coverLetter, warnings, documentCount }`
- `COVER_LETTER_SECTION_ALIASES`
- `RESUME_AI_INSTRUCTIONS`, `COVER_LETTER_AI_INSTRUCTIONS`, `getAiInstructions(kind)`
- `RESUME_AI_EXAMPLE`, `COVER_LETTER_AI_EXAMPLE`
- `SAMPLE_COVER_LETTER_TEXT`

- [ ] Test full letter: all fields, multiple body paragraphs, contact details.
- [ ] Test minimal letter: name + body only; date/recipient/position/salutation/closing/signature empty; no throw.
- [ ] Test unknown section content is preserved in body with a warning; multiple `#` headings set `documentCount: 2`.
- [ ] Test instructions include every resume alias from exported `RESUME_SECTION_ALIASES` and every cover-letter alias.
- [ ] Test instructions contain the factual-accuracy and output-only rules.
- [ ] Test `RESUME_AI_EXAMPLE` parses to a valid resume and `COVER_LETTER_AI_EXAMPLE` parses to a valid letter with body paragraphs.
- [ ] Implement parser and templates; derive alias lists from parser constants.
- [ ] Commit `feat: add cover letter parser and AI instructions`.

Cover-letter input format:

```text
# Full Name
Headline (optional) | email | phone | location | link

## DATE
October 18, 2026

## RECIPIENT
Morgan Lee
Hiring Manager
Brightline Labs
123 Example Street
Toronto, ON M5V 1A1

## POSITION
Senior Product Engineer

## SALUTATION
Dear Ms. Lee,

## BODY
First paragraph.

Second paragraph.

## CLOSING
Sincerely,

## SIGNATURE
Full Name
```

## Task 3: Cover letter layout and exports

**Files:** `src/lib/coverLetterLayout.ts`, `src/lib/layout.ts`, `src/lib/paginate.ts` (BlockKind), `src/lib/exportPdf.ts`, `src/lib/exportDocx.ts`, `src/lib/content.ts`, `src/lib/documentMeta.ts`, tests.

**Consumes:** `CoverLetter`, `ResolvedMetrics`, `buildDocumentHeader` (exported from `layout.ts`), `paginateColumn`.

**Produces:**

- `layoutCoverLetter(letter): Layout` with `kind: 'coverLetter'`
- `Layout.kind: DocumentKind`
- Block kinds `letterDate | recipient | subject | salutation | letterBody | closing | signature`
- `collectCoverLetterContentStrings(letter): string[]`
- `documentMeta(kind, doc)` and `documentFilename(meta, extension)`
- PDF functions accept `DocumentMeta`; DOCX gains `createCoverLetterDocxDocument`

- [ ] Test layout order: date → recipient lines → subject → salutation → body paragraphs → closing → signature.
- [ ] Test minimal letter skips empty blocks and emits one non-blank page.
- [ ] Test long body paginates with every paragraph exactly once, bounds respected, no blank pages.
- [ ] Test page sizes and paragraph spacing affect the letter layout.
- [ ] Test cover-letter PDF page size, real text, and no images.
- [ ] Test cover-letter DOCX has no table, correct page size, all content, and page breaks between logical pages.
- [ ] Test PDF/DOCX parity for every content string.
- [ ] Implement layout and exporters, reusing shared heading/paragraph helpers.
- [ ] Commit `feat: add cover letter layout and exports`.

## Task 4: Storage, migration, and independent drafts

**Files:** `src/lib/storage.ts`, `src/hooks/usePersistedDocument.ts`, `src/hooks/useDraft.ts`, `src/hooks/useCoverLetterDraft.ts`, `tests/storage.test.ts`.

- [ ] Test cover-letter save/load/clear and corrupt payload handling.
- [ ] Test resume and cover-letter drafts coexist under separate keys.
- [ ] Test a v0.1.2 resume draft loads and gains `paragraphSpacing: 'standard'`.
- [ ] Implement generic persisted-document hook and both wrappers.
- [ ] Commit `feat: persist independent resume and cover letter drafts`.

## Task 5: Landing, preparation, and navigation

**Files:** `src/components/LandingPage.tsx`, `src/components/PrepareScreen.tsx` (replaces `ImportScreen.tsx`), `src/components/Header.tsx`, `src/App.tsx`, `src/components/Icon.tsx`, `src/styles/globals.css`, `tests/App.test.tsx`.

**Views:** `landing | prepare | workspace`; **Kinds:** `resume | coverLetter`.

- [ ] Test landing shows Build Resume / Build Cover Letter, draft badges, and routes correctly with and without drafts.
- [ ] Test preparation headings, primary labels, Copy AI Instructions, Load Example, and no example disclosure.
- [ ] Test copy success and failure feedback (mocked clipboard).
- [ ] Test Load Example fills the textarea and does not copy instructions.
- [ ] Test New opens preparation, Back returns to the workspace or landing, and Home returns to landing.
- [ ] Test building over an existing draft calls `confirm`; cancel leaves the old document and remains on prepare.
- [ ] Implement views and screens; remove the old import-oriented copy.
- [ ] Commit `feat: add document landing and preparation flow`.

## Task 6: Cover letter workspace and matching-letter flow

**Files:** `src/components/CoverLetterEditor.tsx`, `src/components/TextField.tsx`, `src/components/SectionEditor.tsx`, `src/components/FormattingPanel.tsx`, `src/App.tsx`, `src/lib/coverLetterEdits.ts`, tests.

- [ ] Test cover-letter identity, date, recipient, position, salutation, body paragraphs, closing, and signature edit the preview.
- [ ] Test add/remove body paragraphs and persistence.
- [ ] Test formatting panel shows paragraph spacing for letters but hides bullet/column spacing; inverse for resumes.
- [ ] Test "Create matching cover letter" opens preparation with name/contact prefilled, leaves the resume unchanged, and Back returns to the resume.
- [ ] Test building the matching letter creates a cover-letter draft and preserves the resume.
- [ ] Test cover-letter workspace offers Back to resume when a resume exists.
- [ ] Implement editor, shared fields, formatting visibility, and flows.
- [ ] Commit `feat: add cover letter workspace and matching letter flow`.

## Task 7: Versions, documentation, and QA

**Files:** `package.json`, `README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `docs/input-format.md`, `docs/interface.md`, `docs/formatting.md`, `docs/ai-instructions.md`, `docs/deployment.md`, `CLAUDE.md`, `AGENTS.md`.

- [ ] Bump to `0.1.3`; add the 0.1.3 changelog section.
- [ ] Document both input formats, AI instruction maintenance, formatting visibility, navigation, storage keys, and migration.
- [ ] Run `npm run format`, `npm run format:check`, `npm run check`.
- [ ] Manually verify landing → prepare → workspace for both kinds; matching flow; theme; exports; mobile.
- [ ] Commit `docs(release): v0.1.3`.
- [ ] Do not push or deploy.
