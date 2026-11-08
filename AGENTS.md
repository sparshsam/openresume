# OpenResume — AI Agent Operating Notes

This file complements `CLAUDE.md`. Read both before changing code.

## Current state (2026-11-08)

- **Published:** https://github.com/sparshsam/openresume — public, MIT.
- **Release:** v0.2.1 — annotated tag `v0.2.1`; GitHub pre-release at https://github.com/sparshsam/openresume/releases/tag/v0.2.1. Deployed at https://resume.kovina.org. The original Vercel address remains at https://openresume-sigma.vercel.app with `noindex`. Prior release: v0.2.0 (PR #9).
- **Prior release:** v0.1.13 — PR [#8](https://github.com/sparshsam/openresume/pull/8) merged as `71ef633133a428ee66e5784da9b1c941be4cbd13` (workspace scroll reset and unambiguous AI identity fields).
- **Verification baseline:** 551 tests across 38 files; lint, format check, typecheck, and build green.
- **Production verification (2026-11-08):** the v0.2.1 application build was verified as deployment `dpl_5seJX3ki1JaPVgQjKM8MBxcB8qgS`, READY on `resume.kovina.org`, serving bundle `main-CSXAa6aE.js` with `0.2.1`, “Close formatting”, “Browse Designs”, and the expanded parser vocabulary. Documentation-only merges may create additional deployments of the same bundle.
- **Résumé designs:** `template.layout` selects one of ten designs (Professional Two-Column default, ATS Simple unchanged, plus eight redesigned compositions) from `src/lib/designs.ts`. Each design declares a page arrangement (`linear`, `balanced`, `sidebarLeft`, `sidebarRight`), identity variant (`stacked`, `centered`, `split`, `banner`, `compact`), heading decoration (`underline`, `trailing`, `bar`, `fill`, `topRule`, `boxed`), entry layout (`stacked`, `titleRow`, `gutter`), and sidebar tint/divider, plus font and spacing scales. Content, pagination, preview, and both exporters are shared. ATS Simple is one full-width column in author order with no tables. Switching designs preserves every content value and stored `column` assignment without re-parsing.
- **Cover-letter styles:** `template.letterStyle` selects Classic (default), Modern, Executive, or Minimal. The resume design suggests a coordinated style but never applies it automatically.
- **Pagination and counts:** `template.pagination.keepEntriesTogether` and `section.startOnNewPage` drive the shared `paginateColumn`; heading blocks always keep their first entry. Page counts are derived from `Layout.pages.length` in the workspace header and, independently, in the kit toolbar.
- **Design gallery and Format drawer:** `FormattingPanel.tsx` is a fixed, non-modal drawer with **Designs** and **Formatting** tabs, a responsive compact thumbnail grid, grouped controls, Escape/close with focus restoration, and a full-screen mobile sheet. `DesignGallery.tsx` is a native radio gallery of locally rendered, design-accurate SVG thumbnails; application-context recommendations only highlight designs.
- **Application Kit order:** the kit toolbar offers cover-letter-first (default) or resume-first for combined PDF and DOCX. The order is session-only UI state, never part of a document template.
- **AI workflow and contact parsing:** all three instruction templates require exactly one plain-text code block; the standalone parsers accept one complete enclosing `text` or unlabelled fence, and the Application Kit parser additionally requires the two document delimiters in resume-then-letter order. All three templates share `AI_FIELD_DEFINITIONS`, which separates professional headline, target job title, employment job title, employer name, and geographic location, defines one canonical contact line, and requires missing parts to be omitted. The parser classifies email/phone/links by shape, accepts a location only when it validates geographically or as a confirmed arrangement and does not read as a title/headline, validates entry metadata the same way, ignores extra emails/phones with warnings, and surfaces rejected values as build warnings.
- **Application Kit:** a third landing card and atomically validated combined workflow that reuses the same resume and cover letter models, editors, formatting, and exporters; the kit workspace adds accessible tabs and combined or separate downloads.
- **README:** includes the full Kovina Collection footer.
- **Repository:** `main` is at or after the v0.2.0 application merge commit `8636cc0` (PR #9); documentation-only commits may follow. Inspect `git log` and `git status` before starting work.
- **Deployment:** https://resume.kovina.org (custom production domain) and https://openresume-sigma.vercel.app (original Vercel address) — Vercel project `openresume`, linked to GitHub `main`; previews for PRs; no environment variables.
- **Branch protection:** active ruleset `main-protection` (`25359494`) requires a PR, conversation resolution, and the `check` CI status with up-to-date branches; blocks direct pushes, force-pushes, and deletion; 0 required approvals; no bypass actors.
- **Architecture:** no backend, authentication, analytics, or cloud storage.

**Handoff:** read `CLAUDE.md` and `AGENTS.md` first to get oriented, inspect the working tree and recent commits, then **wait for Sparsh's instructions** before making changes. Land changes through a PR into protected `main`; do not direct-push, tag, release, or deploy without explicit permission.

**Start here:** `ARCHITECTURE.md`, `docs/interface.md`, `docs/input-format.md`, `docs/formatting.md`, `docs/ai-instructions.md`, `docs/branding.md`, and `docs/deployment.md`. `/releases/latest` is expected to return 404 while the only release is a pre-release; the wiki is enabled but empty. Merging a PR to `main` triggers a Vercel production deployment; PRs get SSO-protected previews. Direct pushes to `main` are rejected by the ruleset.

## Mission

Produce consistent, professional resumes and cover letters from structured text with zero data leaving the browser. Optimize for fast repeated use, not multi-user features.

## Invariants to preserve

- The preview and the two exports of each document share one `Layout`.
- Pagination never duplicates or drops a line, and no blank pages are emitted.
- Content is preserved unless the user edits it.
- Preparation replaces the selected in-memory document without confirmation; multiple top-level headings are rejected.
- No document means preparation; the app never fabricates a document.
- Build always means preparation; a session document is reached only through Open resume / Open cover letter.
- Resume and cover letter state are independent in memory, with separate models and templates.
- Documents never enter `localStorage` or `sessionStorage`; only the theme preference is stored.
- Public information pages share the header and footer and use history navigation, never a full reload that would discard session documents.
- Page size and formatting flow through `resolveMetrics`; no component hard-codes geometry.
- Interface themes never change document, PDF, or DOCX colors.
- No runtime network calls and no document storage.
- AI instructions are generated from parser aliases, must require exactly one plain-text code block, and must remain drift-tested.
- Exactly one complete enclosing code fence is stripped before parsing; ambiguous, partial, or prose-wrapped fences are never rewritten.
- The Application Kit reuses the same `resume` and `coverLetter` models; it never creates a third document copy or duplicates parser rules.
- Kit builds are atomic: both sections are parsed and validated before either model is replaced, and a failed build leaves both previous documents untouched.
- Cross-document name or contact differences produce warnings only; applicant details are never rewritten.
- Combined exports follow the selected `ApplicationKitOrder`, with selectable/editable text and each document's own page dimensions. Combined DOCX uses an explicit page break when geometry matches and `nextPage` Word sections when page sizes or margins differ. The default remains cover letter then resume.
- Résumé designs are registry entries in `designs.ts`; every design reuses `buildSectionBlocks`, shared item formatting, metrics, pagination, and exporters. A design may change columns and styling but never the document model. ATS Simple emits one full-width column in author order, ignores `section.column` without rewriting it, and must not produce tables or positioned columns in DOCX. It must never promise guaranteed ATS compatibility.
- Design and letter-style switching, section reordering, pagination settings, and page counts are presentation or session state: they never re-parse text, replace content, or auto-apply recommendations.
- Heading blocks stay with their first entry; whole entries move when they fit; forced section breaks never create blank pages; oversized entries still flow without loss. Preview, PDF, and DOCX consume the same pages.
- Page counts are read from `Layout.pages.length`, never stored separately.
- Load Example selects by `PrepareKind`. The Application Kit inserts the canonical combined sample from `applicationKitSample.ts`, never the standalone cover letter example.
- Application icons are generated from the two authoritative masters; never hand-edit generated assets or fabricate SVGs.
- The header and favicons use the light artwork in both interface themes through `src/lib/themeAssets.ts`; the near-black `*-dark.png` variants stay out of the interface. Only `theme-color` follows the theme.
- Document accents come only from `template.accent` and must flow through `Layout` to preview, PDF, and DOCX.
- PDF text is selectable; DOCX text is editable and contains every content string.

## Where to change what

| Task                        | Touch                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resume parsing or aliases   | `src/lib/parse.ts`, `docs/input-format.md`, `tests/parse.test.ts`                                                                                 |
| Fenced paste normalization  | `src/lib/codeFence.ts`, `src/lib/parse.ts`, `src/lib/parseCoverLetter.ts`, `tests/codeFence.test.ts`                                              |
| Application Kit parsing     | `src/lib/parseApplicationKit.ts`, `src/lib/applicationKitFormat.ts`, `tests/parseApplicationKit.test.ts`                                          |
| Application Kit sample      | `src/lib/applicationKitSample.ts`, `src/components/PrepareScreen.tsx`, `tests/App.test.tsx`                                                       |
| Application Kit workspace   | `src/App.tsx`, `src/components/ApplicationKitToolbar.tsx`, `tests/App.test.tsx`                                                                   |
| Combined exports            | `src/lib/exportPdf.ts`, `src/lib/exportDocx.ts`, `src/lib/filename.ts`, export tests                                                              |
| Application Kit order       | `src/types/applicationKit.ts`, `ApplicationKitToolbar.tsx`, `src/App.tsx`, `tests/applicationKitOrder.test.ts`                                    |
| Résumé designs              | `src/lib/designs.ts`, `src/types/resume.ts`, `src/lib/normalize.ts`, `src/lib/layout.ts`, `tests/designs.test.ts`, `tests/templateSwitch.test.ts` |
| Design gallery and previews | `src/components/DesignGallery.tsx`, `src/components/DesignThumbnail.tsx`, `tests/App.test.tsx`                                                    |
| Letter styles               | `src/lib/designs.ts`, `src/lib/coverLetterLayout.ts`, `tests/coverLetterStyles.test.tsx`                                                          |
| Pagination controls         | `src/lib/paginate.ts`, `src/lib/layout.ts`, `src/components/SectionEditor.tsx`, `tests/pagination.test.ts`                                        |
| Page counts                 | `src/components/Header.tsx`, `src/components/ApplicationKitToolbar.tsx`, `src/App.tsx`, `tests/pageCounts.test.tsx`                               |
| Section drag ordering       | `src/components/SectionEditor.tsx`, `src/lib/resumeEdits.ts`, `tests/sectionOrdering.test.tsx`                                                    |
| Typography and spacing      | `src/lib/metrics.ts`, `src/lib/tokens.ts`, `tests/typography.test.ts`, `docs/formatting.md`                                                       |
| Cover letter parsing        | `src/lib/parseCoverLetter.ts`, `docs/input-format.md`, `tests/parseCoverLetter.test.ts`                                                           |
| AI instruction templates    | `src/lib/aiInstructions.ts`, `tests/aiInstructions.test.ts`, `docs/ai-instructions.md`                                                            |
| Round-trip format           | `src/lib/serialize.ts`, `tests/serialize.test.ts`                                                                                                 |
| Page geometry, typography   | `src/lib/metrics.ts`, `src/styles/tokens.css`                                                                                                     |
| Document colors             | `src/lib/tokens.ts`                                                                                                                               |
| Wrapping and metrics        | `src/lib/measure.ts`, `tests/layout.test.ts`                                                                                                      |
| Page breaks, keep-with-next | `src/lib/paginate.ts`, `tests/pagination.test.ts`, `tests/layout.test.ts`                                                                         |
| Resume composition          | `src/lib/layout.ts`                                                                                                                               |
| Cover letter layout         | `src/lib/coverLetterLayout.ts`, `tests/coverLetterLayout.test.ts`                                                                                 |
| PDF output                  | `src/lib/exportPdf.ts`, `tests/exportPdf.test.ts`, `tests/exportCoverLetter.test.ts`                                                              |
| DOCX output                 | `src/lib/exportDocx.ts`, `tests/exportDocx.test.ts`, `tests/exportCoverLetter.test.ts`                                                            |
| Legacy cleanup and schema   | `src/lib/storage.ts`, `tests/storage.test.ts`                                                                                                     |
| Page sizes or formatting    | `src/lib/metrics.ts`, `src/components/FormattingPanel.tsx`, `docs/formatting.md`                                                                  |
| Preparation validation      | `src/components/PrepareScreen.tsx`, `src/App.tsx`, `tests/App.test.tsx`                                                                           |
| Landing/prepare/workspace   | `src/App.tsx`, `LandingPage.tsx`, `PrepareScreen.tsx`, `Header.tsx`                                                                               |
| Landing cards and copy      | `src/components/LandingPage.tsx`, `src/styles/globals.css`, `src/styles/tokens.css`                                                               |
| Feedback and toasts         | `src/components/ToastRegion.tsx`, `src/App.tsx`, `src/styles/globals.css`                                                                         |
| Brand masters and icons     | `assets/branding/source-assets/`, `scripts/generate-icons.py`, `docs/branding.md`                                                                 |
| Theme-aware favicon/brand   | `index.html`, `src/components/ThemeProvider.tsx`, `src/components/Header.tsx`                                                                     |
| Public pages and routing    | `src/components/InfoPages.tsx`, `src/lib/publicPages.ts`, `about.html`, `privacy.html`, `terms.html`                                              |
| Brand mark and favicons     | `src/lib/themeAssets.ts`, `src/components/Header.tsx`, `src/components/ThemeProvider.tsx`, `*.html`                                               |
| Document accent colour      | `src/lib/tokens.ts`, `src/components/FormattingPanel.tsx`, `src/lib/layout.ts`, `src/lib/exportDocx.ts`                                           |
| Footer navigation           | `src/components/Footer.tsx`, `src/components/InternalLink.tsx`                                                                                    |
| SEO discovery files         | `public/robots.txt`, `public/sitemap.xml`, `vercel.json`                                                                                          |
| Cover letter editor         | `src/components/CoverLetterEditor.tsx`, `src/lib/coverLetterEdits.ts`                                                                             |
| Matching letter flow        | `src/lib/coverLetterScaffold.ts`, `src/App.tsx`, `tests/App.test.tsx`                                                                             |
| Theme (light/dark/system)   | `src/lib/theme.ts`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, `styles/tokens.css`                                                                   |
| Footer and version          | `src/components/Footer.tsx`, `src/lib/appMeta.ts`, `vite.config.ts`                                                                               |
| Icons                       | `src/components/Icon.tsx` — inline SVG only                                                                                                       |
| Deployment configuration    | `vercel.json`, `docs/deployment.md`                                                                                                               |
| PDF/DOCX content parity     | `src/lib/content.ts`, export tests                                                                                                                |
| Resume editor controls      | `src/components/EditorPanel.tsx`, `SectionEditor.tsx`                                                                                             |
| Document navigation         | `src/components/Header.tsx`, `LandingPage.tsx`, `PrepareScreen.tsx`                                                                               |

## Verification before completion

```bash
npm run check        # lint + typecheck + test + build
npm run format:check # CI also runs this; `check` does not
```

Use `npm run format` to fix Prettier failures. `npm run test:coverage` enforces the thresholds in `vite.config.ts`.

Then, for export-affecting changes, manually export a PDF and DOCX and confirm:

- PDF text can be selected.
- DOCX opens and paragraphs are editable.
- Page count matches the preview on US Letter, A4, and US Legal for both documents.
- A second build replaces only the selected document, without a confirmation dialog.
- Formatting changes appear in the preview and both exports, and document-specific controls are visible only where relevant.
- First launch shows document selection; Build opens preparation regardless of session documents.
- Open resume / Open cover letter return to existing workspaces without changing either document.
- Copy AI Instructions returns the complete template, and Load Example does not copy.
- Create matching cover letter reuses identity/contact and leaves the resume unchanged.
- Both documents coexist across navigation and neither survives a reload.
- No document content appears in `localStorage`; the theme preference still does.
- Toasts and inline validation replace all native alerts; dismiss notifications with the keyboard.
- Light, dark, and system themes work; document pages keep fixed colors.
- Header, landing, preparation, and footer remain usable at 375px.
- Generated icon dimensions, the multi-resolution ICO, and the preserved masters pass `tests/assets.test.ts`.
- Light/dark favicons and the header mark follow the selected theme.
- `/about`, `/privacy`, and `/terms` load directly, refresh, render in both themes, and share header/footer.
- Navigating to an information page and back preserves both in-memory documents and writes no document storage.
- `/robots.txt` and `/sitemap.xml` list only the canonical production domain.
- Light UI displays the dark-background header mark/favicons; dark UI displays the light-background assets.
- Accent changes reach the preview, PDF, and DOCX; resume and cover letter accents stay independent.
- Switching resume layouts preserves every word and reflows the preview; ATS Simple hides column spacing and emits no `<w:tbl>` in DOCX.
- Changing the kit document order reverses both combined exports while preserving page breaks and per-document page sizes.

## Session gotchas

- `npm run check` omits `format:check`; CI does not. Run both.
- `PageView` hard-codes header leading ratios `1.17` (name), `1.24` (headline), `1.38` (contact). Keep them equal to `nameLinePt`, `headlineLinePt`, and `smallLinePt` in `metrics.ts`.
- Every `Layout` producer must set `variant` (`twoColumn` | `atsSimple` | `letter`); the DOCX exporter picks table vs. linear output from it.
- New template fields belong in `normalizeTemplate`; it is the backward-compatibility gate.
- In uncompressed jsPDF output, wrapped lines are separate text runs. Assert long strings after rejoining or use short fixtures; assert ordering separately.
- Page budget baseline at default settings: bundled sample resume = 1 page two-column, 2 pages ATS Simple.
- ATS Simple ignores but preserves `section.column`; the Main/Side selector is hidden via `SectionEditor`'s `showColumn`.
- The kit order is `App` state, so it resets on reload by design. Do not move it into a template or storage.

## Change discipline

- Keep pure logic in `src/lib/`; keep components thin.
- Prefer adding a test to editing an existing one.
- Do not introduce abstractions for hypothetical templates or backends.
- Record limitations rather than hiding them.
- Use a feature branch and PR for every change to `main`; wait for the `check` status and required up-to-date state before merging.
- Do not attempt direct pushes, force-pushes, branch deletion, tags, releases, or deployment without explicit permission.
