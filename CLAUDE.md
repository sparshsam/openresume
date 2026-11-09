# Project Standards

This project follows the Kovina ecosystem standards at <https://github.com/sparshsam/kovina/tree/main/standards>.

Required reading before every session:

- `KOVINA_MANIFESTO.md`
- `BRAND_GUIDELINES.md`
- `DESIGN_PLAYBOOK.md`
- `PRODUCT_ARCHITECTURE_PLAYBOOK.md`

**Precedence:** the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards) are authoritative and win conflicts. Kovina-specific standards apply where they do not conflict.

# OpenResume — Agent Guide

## What this is

OpenResume is a public, MIT-licensed, client-only résumé and cover-letter builder. Structured text is parsed deterministically, laid out once, previewed, and exported as selectable-text PDF and editable DOCX. Nothing a user prepares leaves the browser.

- **Repository:** <https://github.com/sparshsam/openresume>
- **Production:** <https://resume.kovina.org>
- **Current version:** `0.3.0`
- **Two surfaces:** the builder at `/` (Resume, Cover Letter, Application Kit) and the independent guided application workflow at `/prepare` for clients arriving from the Kovina Job Directory.

## Current release (2026-11-08)

- **v0.3.0** — guided `/prepare` workflow, versioned Job Directory URL contract, job-specific AI prompt. Annotated tag `v0.3.0`; pre-release <https://github.com/sparshsam/openresume/releases/tag/v0.3.0>.
- **Application merge:** PR [#14](https://github.com/sparshsam/openresume/pull/14) → `70e54c4421ed347bafde0e802fc716586af973d9`.
- **Release commit:** `70e54c4421ed347bafde0e802fc716586af973d9` (PR #14). **Handoff docs baseline:** `4f44531919dd9e76647259db6e39f6718c79f64d` (PR #15); inspect `git log -1` for the current `main` head.
- **Verified build:** `dpl_3G17mm18pza3BbgEhGti5QwWumCn` READY on `resume.kovina.org`, bundle `main-CLlfKKtg.js`; `/prepare` serves 200 with `X-Robots-Tag: noindex, follow`. The latest docs-only deployment `dpl_2TzfgL3Vym4bVJPF7HHXXSRc5Lzs` is also READY with the same bundle.
- **CI baseline:** `npm run check` and `npm run format:check` pass; 605 tests across 44 files.
- **Prior releases:** v0.2.1 (PR #12 — structural designs, Format drawer, defensive contact parsing), v0.2.0 (PR #9 — ten designs, gallery, letter styles, pagination), v0.1.13 (PR #8 — scroll reset and AI field separation).

## Read first

| Document                                                                 | Use                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md)                                     | Canonical pipeline, module boundaries, layout/pagination, exports, testing |
| [`docs/interface.md`](docs/interface.md)                                 | Landing, builder, guided route, accessibility, responsive behavior         |
| [`docs/input-format.md`](docs/input-format.md)                           | Markers, contact line, metadata, Application Kit format                    |
| [`docs/ai-instructions.md`](docs/ai-instructions.md)                     | AI contracts, fields, locations, guided prompt, drift protection           |
| [`docs/formatting.md`](docs/formatting.md)                               | Designs, page geometry, presets, pagination, page counts                   |
| [`docs/job-directory-integration.md`](docs/job-directory-integration.md) | Versioned `/prepare` query contract and examples                           |
| [`docs/privacy-model.md`](docs/privacy-model.md)                         | Data handling, storage, hosting, guided-route privacy                      |
| [`docs/deployment.md`](docs/deployment.md)                               | Vercel, domains, routes, headers, caching                                  |
| [`docs/maintenance.md`](docs/maintenance.md)                             | Routine checks, dependencies, schema and format changes                    |
| [`VERSIONING.md`](VERSIONING.md)                                         | Semantic versioning and release rules                                      |
| [`CHANGELOG.md`](CHANGELOG.md)                                           | User-visible history                                                       |

## Technology stack

- React 19 + React DOM 19, TypeScript 6, Vite 8, Vitest 5, jsPDF 4, `docx` 9.
- Plain CSS with `src/styles/tokens.css`; no router, state library, CSS framework, or parser library.
- Node.js ≥ 22 (`package.json`); Vercel builds on Node 24.
- Client-only. No server functions, database, authentication, analytics, environment variables, or runtime network calls.
- Vite entries: `index.html`, `about.html`, `privacy.html`, `terms.html`, `prepare.html`.

## Repository map

- `src/App.tsx` — chooses the guided route by pathname; owns the builder's landing/prepare/workspace state and both documents.
- `src/components/` — builder UI (`EditorPanel`, `SectionEditor`, `CoverLetterEditor`, `Preview`, `PageView`, `FormattingPanel`, `DesignGallery`, `DesignThumbnail`, `PrepareScreen`, `Header`, `Footer`, `ToastRegion`, `InfoPages`).
- `src/components/guided/` — `GuidedWorkflow` and the five step components; reuses the builder's editors, preview, formatting, and exporters.
- `src/lib/` — deterministic pipeline and shared logic:
  - parsing: `parse.ts`, `parseCoverLetter.ts`, `parseApplicationKit.ts`, `codeFence.ts`, `contact.ts`;
  - guided: `jobContext.ts`, `guidedPrompt.ts`, `guidedAssistants.ts`, `resumeValidation.ts`;
  - layout: `layout.ts`, `coverLetterLayout.ts`, `metrics.ts`, `measure.ts`, `paginate.ts`, `designs.ts`, `normalize.ts`;
  - exports: `exportPdf.ts`, `exportDocx.ts`, `filename.ts`, `download.ts`, `content.ts`;
  - editing/content: `resumeEdits.ts`, `coverLetterEdits.ts`, `coverLetterScaffold.ts`, `serialize.ts`, `sample.ts`, `coverLetterSample.ts`, `applicationKitSample.ts`;
  - support: `aiInstructions.ts`, `documentMeta.ts`, `publicPages.ts`, `storage.ts`, `theme.ts`, `themeAssets.ts`, `tokens.ts`, `viewScroll.ts`, `links.ts`.
- `src/types/` — `Resume`, `CoverLetter`, `ResumeTemplate`, `ApplicationKitOrder`, shared document types.
- `src/styles/` — `globals.css`, `preview.css`, `tokens.css`.
- `tests/` — 44 Vitest files across parsers, layout, pagination, designs, exports, UI workflows, guided route, assets, and docs.
- `public/`, `assets/` — generated icons/social cards and source branding masters.
- `vercel.json`, `vite.config.ts`, `scripts/` — deployment, build entries, lint/test/build helpers.
- `docs/` — detailed behavior and integration contracts; this file and `AGENTS.md` are the agent entry points.

## Workflows

### Builder (`/`)

- **Landing** — three cards: Resume, Cover Letter, Application Kit. Each offers Build and Copy AI Instructions; session documents also expose Open.
- **Preparation** — paste structured text; Copy AI Instructions, Load Example, inline validation, and the six-step AI workflow. Build always opens preparation and replaces the selected document without confirmation.
- **Resume workspace** — identity/contact editor, section and entry editing, drag or button ordering, live preview, Format drawer, PDF/Word export, live page count.
- **Cover-letter workspace** — applicant identity/contact, date, recipient, position, salutation, body paragraphs, closing, signature, letter style, preview, exports.
- **Application Kit** — one combined AI response parsed atomically into a résumé and cover letter; tabbed workspace with independent edits/formatting; combined or separate exports in a chosen order.
- **Public pages** — `/about`, `/privacy`, `/terms` share the shell and use history navigation, preserving session documents.

### Guided application (`/prepare`)

An independent, client-facing workflow for Job Directory arrivals. It reuses the same document engine but does not replace or alter the builder.

1. **Choose an AI assistant** — shows validated job context; ChatGPT, Claude, and Gemini open their new-chat pages in separate tabs; the client confirms before continuing. No authentication detection or provider API.
2. **Prepare tailored content** — choose résumé-only or résumé-plus-cover-letter output; copy one job-specific prompt. The prompt requires the base résumé and the complete job description, includes the job-description URL, asks for pasted text/screenshots when the URL is inaccessible, and refuses to treat the listing summary as the full description.
3. **Build documents** — paste the assistant output; the existing parsers validate identity, content, and field placement. Errors preserve the text and point back to the assistant.
4. **Review and download** — reuses `EditorPanel`, `CoverLetterEditor`, `Preview`, `FormattingPanel`, templates, and the PDF/DOCX exporters. Guided filenames: `ApplicantName_JobTitle_Resume.pdf` and `ApplicantName_JobTitle_Cover_Letter.docx`. The default builder keeps its existing names.
5. **Apply** — opens the employer application URL in a new tab, reminds the client to have the files ready, and states that OpenResume does not submit applications. If no application URL was supplied, it says so instead of substituting the job-description URL.

The guided route is `noindex, follow`, keeps all state in memory, and never writes applicant data to the URL. A résumé-only rebuild keeps a previously built cover letter in the session but hides it from review/apply instead of deleting it.

## Architecture invariants

The full list is in [`ARCHITECTURE.md`](ARCHITECTURE.md); these are the non-negotiables for coding agents.

1. **One layout per document.** Preview, PDF, and DOCX consume the same `layoutResume`/`layoutCoverLetter` output. Never paginate or recompute geometry in an exporter.
2. **Points are the unit.** Page geometry, typography, and coordinates are PostScript points; CSS renders `pt`, jsPDF consumes them.
3. **Content is preserved.** Parsers never summarize or rewrite; one complete enclosing code fence is a delivery container and is removed, the interior is untouched.
4. **Preparation replaces.** A failed or ambiguous build changes no document; multiple top-level headings are rejected.
5. **Session-only documents.** No document content in `localStorage`, `sessionStorage`, IndexedDB, cookies, or the network. Only `openresume-theme` persists.
6. **No runtime I/O.** No backend, auth, analytics, AI APIs, or fetch/XHR/WebSocket. Exports are generated locally.
7. **Real text exports.** No rasterized pages; PDF text is selectable and DOCX paragraphs are editable.
8. **Independent documents.** Résumé and cover letter models/templates are separate; building one preserves the other.
9. **Designs are presentation.** The registry supplies structural traits, not documents. Switching designs preserves content and stored `section.column` values; never fork the pipeline per design.
10. **Formatting flows through metrics.** Components and exporters consume `resolveMetrics`/`Layout`; never hard-code geometry or spacing.
11. **Pagination is shared.** Heading blocks travel with their first entry; entries move whole when `keepEntriesTogether` is on; forced section breaks never create blank pages; oversized entries flow without loss.
12. **Page counts are derived** from `Layout.pages.length`; never cache them separately.
13. **Theme is interface-only.** Never theme document pages, PDF, or DOCX.
14. **Accent is one model.** `template.accent` flows through `Layout` to preview/PDF/DOCX; no second export palette.
15. **AI instructions are generated** from parser aliases and drift-tested. Never hand-maintain a second contract.
16. **Guided route is orchestration, not a second engine.** It reuses parsers, editors, layout, formatting, and exporters; it only adds validated job context, the prompt, guided filenames, and the five-step shell.
17. **Job context is public-only.** `/prepare` reads only job fields; never applicant data. URLs must be safe `https:` values; job-description and application URLs stay distinct.
18. **Minimal dependencies.** Runtime deps are React, jsPDF, and `docx`. Interface icons are inline SVG. Justify anything else.

## AI, parsing, and field-placement safeguards

- **Structured input:** `# Name`, optional contact line, `##` sections, `###` entries, `-` bullets. The full format and aliases are in [`docs/input-format.md`](docs/input-format.md).
- **One document at a time:** `documentCount` rejects concatenated documents. The Application Kit is the only two-document input and requires the exact `=== OPENRESUME: RESUME ===` / `=== OPENRESUME: COVER LETTER ===` delimiters in that order.
- **Contact line contract:** `Professional Headline | email | phone | Location | Link | Link`. Every part after the name is optional; missing parts are omitted, not shifted.
- **Classification:** email, phone, and links are recognised by shape; a value is accepted as a location only when it validates as a verified geographic place or confirmed arrangement and does not read as a job title, employer, or headline. Entry metadata after `|` uses the same rule. Rejected values become warnings; extra emails/phones are ignored with warnings rather than becoming headline text.
- **AI field definitions:** all three builder templates and the guided prompt share `AI_FIELD_DEFINITIONS` and `AI_CONTACT_LINE_EXAMPLES`, distinguishing professional headline, target job title, employment job title, employer, and geographic location. Drift tests enforce the contract.
- **Guided prompt:** `buildGuidedPrompt` requires both the base résumé and the complete job description, includes the job-description URL, asks for pasted text/screenshots when the URL cannot be read, forbids invented facts, and marks the listing summary as untrusted data rather than the full JD. It embeds the existing `getAiInstructions('resume'|'applicationKit')` output contract.
- OpenResume never calls an AI provider. The client opens the provider in another tab and decides what to paste there.

## Designs, formatting, pages, and exports

- **Ten résumé designs** in `src/lib/designs.ts`: Professional Two-Column (default), ATS Simple (unchanged original), Executive, Modern Minimal, Classic, Creative, Compact, Academic, Contemporary, Bold. A design declares arrangement (`linear`, `balanced`, `sidebarLeft`, `sidebarRight`), identity variant (`stacked`, `centered`, `split`, `banner`, `compact`), heading decoration (`none`, `underline`, `trailing`, `bar`, `fill`, `topRule`, `boxed`), entry layout (`stacked`, `titleRow`, `gutter`), sidebar tint/divider, font, and spacing scales.
- **Four cover-letter styles:** Classic (default), Modern, Executive, Minimal. Suggested styles are informational and never auto-applied.
- **Format drawer:** fixed, non-modal, **Designs** and **Formatting** tabs; compact proportional SVG thumbnails; grouped controls; Escape/close with focus restoration; full-screen mobile sheet. See [`docs/formatting.md`](docs/formatting.md).
- **Page sizes:** US Letter (default), A4, US Legal. Formatting presets cover margins, font size, line/section/paragraph/bullet/column spacing, density, accent, and keep-entries-together.
- **Exports:** PDF via jsPDF in points, real text, vector rules/bands; DOCX via `docx`, editable text, tables for two-column/kit layouts, linear flow for single-column designs and letters; filename helpers in `src/lib/filename.ts`. The Application Kit can export combined PDF/DOCX in cover-letter-first (default) or résumé-first order.
- **No ATS guarantee:** ATS Simple reduces common parsing obstacles but cannot guarantee compatibility with any system. Recommendations do not predict hiring outcomes.

## Privacy, security, and deployment

- No backend, accounts, analytics, telemetry, cloud storage, environment variables, or runtime network calls. The app is static Vite output on Vercel.
- Only the theme preference is stored in `localStorage`; documents are in-memory for the session. `clearLegacyDrafts()` removes old v0.1.x draft keys after validating them, on both the builder and guided routes.
- The guided route accepts only public job information in the URL. Applicant names, emails, résumés, and generated documents are never read from or written to it. Job URLs must be credential-free `https:`; limits are 200 characters for short fields, 4,000 for summaries, and 2,048 for URLs.
- CSP is `default-src 'self'`, `connect-src 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, with same-origin scripts/styles and inline theme bootstrap. Security headers and caching are in `vercel.json`; details in [`docs/deployment.md`](docs/deployment.md).
- `/prepare` is `noindex, follow`; the Job Directory contract is [`docs/job-directory-integration.md`](docs/job-directory-integration.md).

## Development, testing, and release

```bash
npm ci
npm run dev            # Vite dev server
npm run build          # typecheck + production build → dist/
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest
npm run test:coverage  # Vitest + coverage thresholds
npm run check          # lint + typecheck + test + build
npm run format:check   # Prettier check (CI runs this; check does not)
npm run format         # fix formatting
```

- Add tests with every behavior change. Critical surfaces: both parsers, the kit parser, contact/location placement, design switching/content preservation, guided context/prompt/flow, pagination, exports, preparation validation, AI instruction drift, session independence, and generated assets.
- The maintainer performs manual UI, usability, and document acceptance testing. Agents must run the automated checks and may inspect generated output programmatically; do not claim manual acceptance.
- `main` is protected by ruleset `main-protection` (`id: 25359494`): PR required, `check` status required, branch up to date, conversation resolution, no direct/force pushes or deletion, 0 required approvals, no bypass actors.
- Every change lands through a feature branch and PR. Run `npm run check` and `npm run format:check`; wait for CI; merge with the repository's allowed method.
- Do not tag, release, or deploy unless explicitly asked. Tags are immutable; a failed release should be fixed with a new patch, not a moved tag. Documentation-only changes do not get a tag or release.
- Versioning follows [`VERSIONING.md`](VERSIONING.md): `0.x.0` for features/workflows, `0.x.y` for fixes; update `package.json`, `package-lock.json`, `src/lib/appMeta.ts`, README, CHANGELOG, and docs.
- Merging to `main` triggers a Vercel production deployment. Verify the deployment is READY, the live bundle contains the expected version/strings, and `/`, `/about`, `/privacy`, `/terms`, and `/prepare` return 200.
- If `gh`/`git` authentication fails locally, unset the shadowing token: `env -u GITHUB_TOKEN gh ...` / `env -u GITHUB_TOKEN git ...`.

## Decisions, constraints, and known limitations

- **Guided output choices are résumé-only or résumé-plus-cover-letter.** There is no cover-letter-only guided flow.
- **Guided review exports per active document tab**, not a combined Application Kit file. The builder's kit toolbar remains the place for combined exports.
- **“Both formats” triggers two downloads** (PDF then DOCX); some browsers may ask for permission or block the second one. Individual PDF/Word buttons remain available.
- **The assistant's browsing is not guaranteed.** The guided prompt requires the AI to ask for pasted text or screenshots when the job-description URL cannot be read; OpenResume itself never fetches the URL.
- **Job context is a preview, not the full JD.** `details`/`qualifications` are summaries and are explicitly marked untrusted in the prompt.
- **`/prepare` is not indexed.** It is a client workflow, not a public landing page.
- **No persistence.** Reloads, navigation away, and closing the tab lose the documents and guided session.
- **`/releases/latest` returns 404** while all releases are pre-releases; this is expected.
- **ATS Simple is an aid, not a guarantee.**
- **Visual work is separate.** Another session may be developing a visual redesign on `feat/visual-redesign`; do not modify, merge, reset, or delete that branch or its working directory.

## Session gotchas

- `npm run check` does **not** run `format:check`; CI does. Run both.
- Every `Layout` producer must set `variant`, `columns`, `headerAlign`, and `fontFamily`. The DOCX exporter chooses table vs. linear output from `columns`, not `variant`.
- New design ids go into `ResumeLayoutId`, `normalize.ts`'s `LAYOUTS`, and `RESUME_DESIGNS`; new letter styles into `CoverLetterStyleId`, `LETTER_STYLES`, and `COVER_LETTER_STYLES`. `normalizeTemplate` is the backward-compatibility gate.
- `twoColumn` and `atsSimple` are identity traits; keep their original scales, Helvetica, and header/heading settings.
- `PageView` duplicates header leading ratios (`1.17` name, `1.24` headline, `1.38` contact); keep them in step with `metrics.ts`.
- Keep-together heights are computed in `buildSectionBlocks`; `paginateColumn` only applies them when the unit fits a page. Page counts come from `Layout.pages.length`.
- PDF containment tests need short fixture lines because jsPDF writes one text operator per wrapped line; assert long content after rejoining or via layout text.
- The bundled sample is 1 page in Professional Two-Column and 2 pages in ATS Simple at default settings. Moving that baseline is a product decision.
- Guided route specifics: `prepare.html` + `GuidedWorkflow`; `/prepare` is noindex; job warnings clear on edit; legacy drafts clear on both routes; a résumé-only rebuild hides but preserves an existing cover letter; guided filenames are separate from builder filenames.
- Generated icons and social assets come from `assets/branding/source-assets/` via `scripts/generate-icons.py`; never hand-edit `public/` or `assets/app-icon/` outputs. The interface uses the light artwork in both themes through `themeAssets.ts`.

## Working agreement

- Keep pure logic in `src/lib/`; keep components thin. Prefer a focused change and a test over a broad refactor.
- Update `docs/` and `CHANGELOG.md` for behavior changes; update `VERSIONING.md` only for version-policy changes.
- Do not modify or audit other Kovina repositories from this project.
- Do not direct-push, force-push, delete protected branches, tag, release, or deploy without explicit permission.
- When in doubt, read the linked detailed document rather than guessing; the codebase and tests are the final authority.
