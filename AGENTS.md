# OpenResume — AI Agent Operating Notes

Read `CLAUDE.md` first for the project model, architecture, standards, and invariants. This file is the operational companion: current state, where to change what, verification, and branch/release discipline.

## Current state (2026-11-08)

- **Published:** <https://github.com/sparshsam/openresume> — public, MIT.
- **Version:** `0.3.0` — guided `/prepare` workflow, versioned Job Directory URL contract, job-specific AI prompt.
- **Release:** annotated tag `v0.3.0`; GitHub pre-release <https://github.com/sparshsam/openresume/releases/tag/v0.3.0>.
- **Release commit:** `70e54c4421ed347bafde0e802fc716586af973d9` (PR #14). **Handoff docs baseline:** `4f44531919dd9e76647259db6e39f6718c79f64d` (PR #15); inspect `git log -1` for the current `main` head.
- **Production:** <https://resume.kovina.org> — <https://openresume-sigma.vercel.app> remains with `noindex`. Vercel project `openresume`, linked to `main`; previews are SSO-protected, production is public, no environment variables.
- **Verified build:** `dpl_3G17mm18pza3BbgEhGti5QwWumCn` READY, bundle `main-CLlfKKtg.js`; `/prepare` 200 with `X-Robots-Tag: noindex, follow`. The latest docs-only deployment `dpl_2TzfgL3Vym4bVJPF7HHXXSRc5Lzs` is READY with the same bundle.
- **Verification baseline:** `npm run check` and `npm run format:check` pass; 605 tests across 44 files.
- **Open PRs:** none when this was written.
- **Branch protection:** ruleset `main-protection` (`25359494`): PR required, `check` status required, up-to-date branch, conversation resolution, no direct/force pushes or deletion, 0 required approvals, no bypass actors.

## Read-first

`ARCHITECTURE.md`, `docs/interface.md`, `docs/input-format.md`, `docs/ai-instructions.md`, `docs/formatting.md`, `docs/job-directory-integration.md`, `docs/privacy-model.md`, `docs/deployment.md`, `docs/maintenance.md`, `VERSIONING.md`, `CHANGELOG.md`.

## Invariants to preserve

- Client-only: no backend, auth, analytics, AI API, environment variables, or runtime network calls. Only the theme is persisted; documents are in-memory for the session.
- One `Layout` feeds preview, PDF, and DOCX; points are the unit; exports contain real selectable/editable text.
- Parsers are deterministic and preserve content. Preparation replaces the selected document; multiple top-level headings are rejected; one complete enclosing code fence is a delivery container, not content.
- Résumé and cover-letter models are independent. Building one must not change the other.
- Designs are presentation: registry traits, one shared block/pagination/metrics/export pipeline; switching designs preserves content and stored `section.column`.
- Formatting flows through `resolveMetrics`/`Layout`; page counts are `Layout.pages.length`; theme never touches document colors.
- AI instructions are generated from parser aliases, drift-tested, and must keep the shared field-placement contract.
- `/prepare` is orchestration over the same engine: validated public job context, guided prompt, five steps, guided filenames, employer application link. It never accepts applicant data in the URL, never fetches the job URL, never calls an AI provider, and never submits an application.
- Job URLs are credential-free `https:`; job-description and application URLs are distinct; invalid/oversized values are dropped or shortened with warnings.
- Chosen guided template changes survive a rebuild; a résumé-only rebuild hides but preserves an existing cover letter.
- Generated icons come from the authoritative masters; never hand-edit `public/` or `assets/app-icon/` outputs.

## Where to change what

| Task                             | Touch                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guided route shell and steps     | `src/components/guided/`, `src/App.tsx`, `prepare.html`, `vite.config.ts`, `tests/guidedWorkflow.test.tsx`                                          |
| Job Directory URL contract       | `src/lib/jobContext.ts`, `docs/job-directory-integration.md`, `tests/jobContext.test.ts`                                                            |
| Guided AI prompt                 | `src/lib/guidedPrompt.ts`, `src/lib/aiInstructions.ts`, `docs/ai-instructions.md`, `tests/guidedPrompt.test.ts`                                     |
| Guided review and exports        | `src/components/guided/GuidedStepReview.tsx`, `src/lib/download.ts`, `src/lib/filename.ts`, `tests/guidedExport.test.tsx`, `tests/filename.test.ts` |
| Guided assistant links           | `src/lib/guidedAssistants.ts`, `GuidedStepAssistant.tsx`                                                                                            |
| Guided page metadata/routing     | `src/lib/publicPages.ts`, `prepare.html`, `vercel.json`, `tests/publicPages.test.ts`                                                                |
| Resume parsing or aliases        | `src/lib/parse.ts`, `docs/input-format.md`, `tests/parse.test.ts`                                                                                   |
| Fenced paste normalization       | `src/lib/codeFence.ts`, both standalone parsers, `tests/codeFence.test.ts`                                                                          |
| Contact/location classification  | `src/lib/contact.ts`, `src/lib/parse.ts`, `docs/ai-instructions.md`, `tests/contact.test.ts`, `tests/aiFieldPlacement.test.ts`                      |
| AI instruction templates         | `src/lib/aiInstructions.ts`, `tests/aiInstructions.test.ts`, `docs/ai-instructions.md`                                                              |
| Application Kit parsing/sample   | `src/lib/parseApplicationKit.ts`, `applicationKitFormat.ts`, `applicationKitSample.ts`, `tests/parseApplicationKit.test.ts`                         |
| Application Kit workspace        | `src/App.tsx`, `src/components/ApplicationKitToolbar.tsx`, `tests/App.test.tsx`                                                                     |
| Application Kit order            | `src/types/applicationKit.ts`, `ApplicationKitToolbar.tsx`, `src/App.tsx`, `tests/applicationKitOrder.test.ts`                                      |
| Résumé designs                   | `src/lib/designs.ts`, `src/types/resume.ts`, `src/lib/normalize.ts`, `src/lib/layout.ts`, `tests/designs.test.ts`, `tests/templateSwitch.test.ts`   |
| Design gallery/thumbnails/drawer | `src/components/DesignGallery.tsx`, `DesignThumbnail.tsx`, `FormattingPanel.tsx`, `tests/App.test.tsx`, `tests/formattingDrawer.test.tsx`           |
| Letter styles                    | `src/lib/designs.ts`, `src/lib/coverLetterLayout.ts`, `tests/coverLetterStyles.test.tsx`                                                            |
| Pagination and page counts       | `src/lib/paginate.ts`, `src/lib/layout.ts`, `SectionEditor.tsx`, `Header.tsx`, `ApplicationKitToolbar.tsx`, pagination/page-count tests             |
| Section drag ordering            | `src/components/SectionEditor.tsx`, `src/lib/resumeEdits.ts`, `tests/sectionOrdering.test.tsx`                                                      |
| Typography, metrics, colors      | `src/lib/metrics.ts`, `src/lib/tokens.ts`, `docs/formatting.md`, `tests/typography.test.ts`                                                         |
| Cover-letter parsing/editing     | `src/lib/parseCoverLetter.ts`, `coverLetterEdits.ts`, `coverLetterScaffold.ts`, `CoverLetterEditor.tsx`, relevant tests                             |
| Resume layout                    | `src/lib/layout.ts`, `src/lib/measure.ts`, `tests/layout.test.ts`                                                                                   |
| PDF export                       | `src/lib/exportPdf.ts`, `tests/exportPdf.test.ts`, `tests/exportCoverLetter.test.ts`                                                                |
| DOCX export                      | `src/lib/exportDocx.ts`, `tests/exportDocx.test.ts`, `tests/exportCoverLetter.test.ts`                                                              |
| Filenames and downloads          | `src/lib/filename.ts`, `src/lib/download.ts`, export/filename tests                                                                                 |
| Preparation validation           | `src/components/PrepareScreen.tsx`, `src/App.tsx`, `tests/App.test.tsx`                                                                             |
| Landing/preparation/workspace    | `src/App.tsx`, `LandingPage.tsx`, `PrepareScreen.tsx`, `Header.tsx`                                                                                 |
| Public pages and metadata        | `src/components/InfoPages.tsx`, `src/lib/publicPages.ts`, `about.html`, `privacy.html`, `terms.html`, `tests/publicPages.test.ts`                   |
| Footer, version, theme           | `src/components/Footer.tsx`, `src/lib/appMeta.ts`, `src/lib/theme.ts`, `ThemeProvider.tsx`, `styles/tokens.css`                                     |
| Brand assets and icons           | `assets/branding/source-assets/`, `scripts/generate-icons.py`, `docs/branding.md`                                                                   |
| Deployment configuration         | `vercel.json`, `docs/deployment.md`                                                                                                                 |
| Legacy drafts                    | `src/lib/storage.ts`, `src/App.tsx`, `GuidedWorkflow.tsx`, `tests/storage.test.ts`                                                                  |

## Verification

```bash
npm run check        # lint + typecheck + test + build
npm run format:check # CI runs this; `check` does not
npm run test:coverage
```

Use `npm run format` to fix Prettier failures. Add tests with behavior changes; do not weaken existing assertions. The maintainer performs manual UI, usability, and document acceptance testing — agents run automated checks and may inspect generated output programmatically, but must not claim manual acceptance.

For export-affecting changes, at minimum assert programmatically that PDF text is selectable, DOCX text is editable, content strings are present, and page counts match `Layout.pages.length`. Do not add manual acceptance steps to an agent's completion claim.

## Branch, PR, release, and deployment

- Branch from `main`, keep the change focused, commit, push, open a PR. `main` is protected: direct/force pushes and deletion are rejected; the PR needs the `check` status, an up-to-date branch, and resolved conversations.
- Do not tag, release, deploy, or merge without explicit permission. Documentation-only changes do not get a tag or release; tags are immutable and a release failure is fixed with a new patch, never a moved tag.
- Versioning policy: `VERSIONING.md`. Update `package.json`, `package-lock.json`, `src/lib/appMeta.ts`, README, CHANGELOG, and docs together for a release.
- Merging to `main` triggers a Vercel production deployment. Verify READY state, the live bundle contains the version/new strings, and `/`, `/about`, `/privacy`, `/terms`, and `/prepare` return 200. `/prepare` must keep `X-Robots-Tag: noindex, follow`.
- If `gh`/`git` authentication fails locally, unset the shadowing token: `env -u GITHUB_TOKEN gh ...` / `env -u GITHUB_TOKEN git ...`.
- Do not modify, merge, reset, or delete the separate `feat/visual-redesign` work or its working directory. Keep unrelated branches and worktrees untouched.

## Session gotchas

- `npm run check` omits `format:check`; CI does not. Run both.
- `PageView` uses fixed header leading ratios `1.17` (name), `1.24` (headline), `1.38` (contact). Keep them aligned with `metrics.ts`.
- Every `Layout` producer must set `variant`, `columns`, `headerAlign`, and `fontFamily`; DOCX chooses tables vs. linear flow from `columns`.
- New template fields go through `normalize.ts`; new design ids go into `ResumeLayoutId`, `LAYOUTS`, and `RESUME_DESIGNS`; new letter styles into `CoverLetterStyleId`, `LETTER_STYLES`, and `COVER_LETTER_STYLES`.
- Keep the original `twoColumn` and `atsSimple` identity traits unchanged; ATS Simple ignores but preserves `section.column` and must stay table-free in DOCX.
- Keep-together heights are computed in `buildSectionBlocks`; `paginateColumn` applies them only when the unit fits. Page counts are derived.
- Uncompressed jsPDF writes separate text operators per wrapped line; use short fixtures or rejoin layout text for long-string assertions.
- Page-budget baseline at defaults: sample résumé is 1 page two-column and 2 pages ATS Simple.
- Guided specifics: `prepare.html` + `GuidedWorkflow`; `/prepare` is noindex; job warnings clear on edit; legacy drafts clean on both routes; hidden cover letter survives a résumé-only rebuild; guided filenames are separate from builder filenames.
- No document content in `localStorage`; only `openresume-theme`. Legacy v0.1.x keys are removed after validation.
- Generated icons and social assets are never hand-edited; use the masters and `scripts/generate-icons.py`.
- The repository wiki is empty; `/releases/latest` returns 404 while all releases are pre-releases.

## Change discipline

- Keep pure logic in `src/lib/`, components thin, and tests close to the behavior.
- Prefer focused changes and real regression tests over broad refactors or speculative abstractions.
- Update docs and CHANGELOG for behavior changes; update VERSIONING only for version-policy changes.
- Do not modify other Kovina repositories from this project.
- Record limitations rather than hiding them; read the linked detailed docs and the implementation when in doubt.
