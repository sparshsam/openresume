# Project Standards

This project follows the Kovina ecosystem standards at:
https://github.com/sparshsam/kovina/tree/main/standards

Required reading before every session:

- KOVINA_MANIFESTO.md
- BRAND_GUIDELINES.md
- DESIGN_PLAYBOOK.md
- PRODUCT_ARCHITECTURE_PLAYBOOK.md

**Precedence:** the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards) are authoritative and win conflicts. Kovina-specific standards apply where they do not conflict.

# OpenResume — Agent Notes

## What this is

A client-only React + TypeScript + Vite resume and cover letter builder. Structured text is prepared, parsed deterministically, laid out with one of ten résumé designs or four single-column letter styles (US Letter default plus A4 and US Legal), previewed, and exported as selectable-text PDF and editable DOCX.

## Current state (2026-11-08)

- **Published:** https://github.com/sparshsam/openresume — public, MIT.
- **Version:** v0.2.1 (eight structurally redesigned résumé compositions, compact Format drawer, defensive contact/location parsing, explicit AI contact contract), released and deployed.
- **Release:** annotated tag `v0.2.1`; GitHub pre-release published at https://github.com/sparshsam/openresume/releases/tag/v0.2.1. PR [#12](https://github.com/sparshsam/openresume/pull/12) merged as `73141693ee1ae4a62e7dc1b12ac137fda6a8e13c`. The application build was verified on `resume.kovina.org` as deployment `dpl_5seJX3ki1JaPVgQjKM8MBxcB8qgS`, READY, serving bundle `main-CSXAa6aE.js` (contains `0.2.1`, `Close formatting`, `Browse Designs`, and the expanded parser vocabulary). Documentation-only commits may follow and can create additional deployments of the same bundle.
- **Prior release:** v0.2.0 — PR [#9](https://github.com/sparshsam/openresume/pull/9) merged as `8636cc0d9b1698fc888fa71c6bc35f7c1ea0cd0a` (ten designs, gallery, letter styles, pagination controls).
- **Prior release:** v0.1.13 — PR [#8](https://github.com/sparshsam/openresume/pull/8) merged as `71ef633133a428ee66e5784da9b1c941be4cbd13` (workspace scroll reset and unambiguous AI identity fields).
- **CI:** `.github/workflows/ci.yml` runs lint, format check, typecheck, tests, and build. Latest v0.2.1 run passed with 551 tests across 38 files.
- **Verification baseline:** `npm run check` and `npm run format:check`.
- **README:** includes the canonical Kovina Collection footer.
- **Deployment:** https://resume.kovina.org is the primary production address; the original Vercel deployment remains at https://openresume-sigma.vercel.app. Vercel project `openresume`, linked to GitHub `main`; PRs get preview deployments; no environment variables; no backend, accounts, analytics, or cloud storage. See `docs/deployment.md`.
- **Branch protection:** active repository ruleset `main-protection` (`id: 25359494`) blocks direct pushes, force-pushes, and deletion; requires a PR, conversation resolution, and the `check` CI status, with branches up to date. Required approvals are 0 so the owner can merge their own PR. No bypass actors.

**For future sessions:** read `CLAUDE.md` and `AGENTS.md` first to get oriented, inspect the working tree and recent commits, then **wait for Sparsh's instructions** before editing, committing, pushing, tagging, releasing, or deploying. Do not direct-push or deploy without explicit approval; land changes through a PR into protected `main`.

**Known notes:** `/releases/latest` returns 404 while the only release is a pre-release; this is expected until a stable release exists. The repository wiki is enabled but empty. Merging a PR to `main` triggers a Vercel production deployment; PRs get preview deployments, which are SSO-protected while production is public. Direct pushes to `main` are rejected by the ruleset.

## Session gotchas

- **`npm run check` does not run `format:check`.** CI does. Run both before claiming completion, or Prettier failures land on the PR.
- **`PageView` duplicates three leading ratios** for the header: `1.17` name, `1.24` headline, `1.38` contact lines. They must stay in step with `nameLinePt`, `headlineLinePt`, and `smallLinePt` in `metrics.ts`. Lines are absolutely positioned from layout coordinates, so a drift is a subtle baseline shift rather than an obvious break.
- **Every `Layout` producer must set `variant`, `columns`, `headerAlign`, and `fontFamily`.** `variant` is the design id (`twoColumn`…`bold`) or `letter`; the DOCX exporter chooses table vs. linear output from `columns`, not from `variant`. A missing or wrong value silently changes the Word structure.
- **All new template fields go through `normalizeTemplate`.** That function is the backward-compatibility gate; an unnormalized field will break on legacy or externally supplied templates. New résumé design ids must also be added to the `LAYOUTS` set and `ResumeLayoutId`; new letter styles to `LETTER_STYLES` and `CoverLetterStyleId`.
- **The two original designs are identity traits.** `twoColumn` and `atsSimple` must keep `nameScale: 1`, `heading.scale: 1`, `body.scale: 1`, Helvetica, and the original header/heading settings. Changing them shifts existing output and the page-budget baseline.
- **Cover-letter metrics need the document kind.** `resolveMetrics(template, 'coverLetter')` uses `template.letterStyle`; letter templates copy the résumé template when created, so `template.layout` must never influence letter typography.
- **Keep-together heights are computed in `buildSectionBlocks`.** Heading blocks always carry the height of heading + first entry; entry blocks carry their own height only when `keepEntriesTogether` is on. `paginateColumn` only honours them when the unit fits a page; do not move this logic into the paginator.
- **Page counts are derived.** UI reads `layout.pages.length`; never cache or recompute page counts in components.
- **Design thumbnails are local SVG.** Never add image fetches, external assets, or screenshot-based thumbnails to the gallery.
- **`reorderSection` inserts before the drop target.** Drag-and-drop and the up/down buttons must produce the same ordering, and reordering must never rewrite `section.column`.
- **PDF containment tests need short fixture lines.** jsPDF writes one text operator per wrapped line in uncompressed output, so a long bullet never appears contiguously. Use short fixtures for `toContain` assertions and separate ordering tests for long content.
- **Page-budget baseline:** the bundled sample resume is 1 page in Professional Two-Column and 2 pages in ATS Simple at default settings. Spacing changes that move these are product decisions, not just test updates.
- **ATS Simple stores column assignments.** It ignores `section.column` but never rewrites it, so switching back to two-column restores the original layout. The per-section Main/Side selector is hidden through `showColumn` in `SectionEditor`.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # typecheck + production build → dist/
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run check        # lint + typecheck + test + build
npm run format:check # Prettier check (CI runs this too; `check` does not)
```

## Architecture map

- `src/App.tsx` — landing/prepare/workspace state and both documents.
- `src/lib/viewScroll.ts` — resets the page and workspace scroll areas when a build opens the workspace.
- `src/components/LandingPage.tsx` — three-card document selection (Resume, Cover Letter, Application Kit) with Build, Copy AI Instructions, and session Open actions.
- `src/components/ApplicationKitToolbar.tsx` — accessible kit tabs, document-order control, independent page counts, and combined/separate export actions.
- `src/types/applicationKit.ts` — `ApplicationKitOrder` and its cover-letter-first default.
- `src/lib/designs.ts` — registry of the ten résumé designs and four cover-letter styles, application-context recommendations, and letter-style suggestions.
- `src/components/DesignGallery.tsx` / `DesignThumbnail.tsx` — accessible design and letter-style galleries with local SVG thumbnails.
- `src/lib/layout.ts` — shared header, section/item block builders, design-driven columns, and page assembly. `Layout.variant` records the design id, `Layout.columns` tells the DOCX exporter whether to emit tables or a linear flow.
- `src/lib/paginate.ts` — line-boundary pagination with heading/entry keep-together units and forced section page breaks.
- `src/components/ToastRegion.tsx` — dismissible success and error notifications.
- `src/components/InfoPages.tsx` — About, Privacy, and Terms content.
- `src/components/InternalLink.tsx` / `src/lib/publicPages.ts` — history-based public-page navigation and metadata.
- `about.html`, `privacy.html`, `terms.html` — static public shells with page-specific SEO metadata.
- `public/robots.txt` / `public/sitemap.xml` — canonical-only discovery files.
- `src/components/PrepareScreen.tsx` — shared preparation for resume, cover letter, and Application Kit, with validation, AI copy, and examples.
- `src/components/Header.tsx` — brand/home, New, Format, PDF/Word, document label, live page count, theme.
- `src/lib/themeAssets.ts` — one visible brand mark and favicon for both interface themes (the light artwork).
- `src/lib/tokens.ts` — document accent palette and fixed neutral document colors.
- `src/components/FormattingPanel.tsx` — design/letter-style galleries, pagination controls, document formatting, and the accessible accent swatch group.
- `src/components/SectionEditor.tsx` / `src/lib/resumeEdits.ts` — section controls, `New page` toggle, drag handle, and the pure `moveSection`/`reorderSection` helpers.
- `src/components/ThemeProvider.tsx` / `src/lib/theme.ts` — light/dark/system theme.
- `src/components/Footer.tsx` / `src/lib/appMeta.ts` — Kovina attribution and version.
- `assets/branding/source-assets/` — authoritative light/dark logo masters.
- `scripts/generate-icons.py` — reproduces every icon and social asset from those masters.
- `docs/branding.md` — asset inventory, standards, and generation pipeline.
- `src/components/Icon.tsx` — inline SVG icons; no icon dependency.
- `docs/interface.md` — workflow, navigation, theme, responsive, and accessibility rules.
- `src/lib/codeFence.ts` — strips one complete enclosing code fence before parsing; leaves ambiguous input untouched.
- `src/lib/applicationKitFormat.ts` — shared Application Kit delimiter constants.
- `src/lib/applicationKitSample.ts` — canonical combined sample shared by Load Example and the AI template.
- `src/lib/parseApplicationKit.ts` — splits one delimited input into the two existing parsers; validates order, count, emptiness, names, and body; warns on cross-document differences.
- `src/lib/parse.ts` — text → `Resume` (pure, deterministic); reports `documentCount`.
- `src/lib/parseCoverLetter.ts` — text → `CoverLetter`; reports `documentCount`.
- `src/lib/contact.ts` — shared contact-line classification.
- `src/lib/serialize.ts` — `Resume` → text (round-trip).
- `src/lib/normalize.ts` — legacy template upgrade and preset validation.
- `src/lib/metrics.ts` — design scales and formatting presets → page geometry, typography, and spacing (including the 8.8 pt secondary text and the section/entry spacing scale).
- `src/lib/measure.ts` — Helvetica/Times AFM widths, letter spacing, and wrapping.
- `src/lib/coverLetterLayout.ts` — single-column letter layout driven by the selected letter style.
- `src/lib/coverLetterEdits.ts` / `coverLetterScaffold.ts` — letter edits and resume-detail reuse.
- `src/lib/aiInstructions.ts` — parser-generated AI instruction templates, including the delimited Application Kit template.
- `src/lib/content.ts` — content strings for PDF/DOCX parity checks.
- `src/lib/exportPdf.ts` / `exportDocx.ts` — render either document's `Layout` with Helvetica/Times, header/heading rules, and letter spacing; both also expose a combined Application Kit exporter.
- `src/lib/storage.ts` — validated one-time cleanup of v0.1.x draft entries.

Full design: `ARCHITECTURE.md`.

## Non-negotiable rules

1. **One layout per document.** Preview and both exporters consume `layoutResume` or `layoutCoverLetter`. Never re-paginate in an exporter.
2. **Points everywhere.** Page geometry and typography use pt. CSS uses `pt`; jsPDF uses pt.
3. **Preserve content.** Both parsers must not summarize or rewrite text.
4. **No document persistence.** No network, backend, auth, analytics, cloud storage, or AI. Documents live in memory for the session; only the theme is stored in `localStorage`.
5. **Real text exports.** Never rasterize a page.
6. **Preparation replaces, never merges.** Keep the multiple-heading rejection and replace the previous in-memory document without a confirmation dialog.
7. **Document selection first, never fabricated.** Build always opens preparation. Open resume / Open cover letter are the only paths from the landing page into an existing workspace.
8. **Independent session documents.** Resume and cover letter state use separate models and templates. Building one must not change the other.
9. **AI instructions are generated.** Never hand-maintain a second template; update parser aliases and let the drift tests verify.
10. **Formatting flows through metrics.** Components and exporters consume `resolveMetrics`/`Layout`; never hard-code page geometry or spacing.
11. **Theme is interface-only.** Use tokens from `styles/tokens.css`; never theme document pages, PDF, or DOCX.
12. **Minimal dependencies.** Runtime deps are React, jsPDF, and docx. Interface icons are inline SVG. Justify anything else.
13. **Brand assets are generated.** Never hand-edit files in `public/` or `assets/app-icon/`. Update the authoritative masters only with approval, then run `scripts/generate-icons.py`.
14. **No SVG icon fabrication.** The masters are raster; do not wrap them in SVGs or invent vector versions.
15. **Public navigation never reloads the builder.** Use `InternalLink`/`navigate` for `/about`, `/privacy`, and `/terms`; session documents must survive the round trip. Direct loads rely on the static shells and Vercel `cleanUrls`.
16. **Every page shares the shell and metadata.** Header, footer, theme controls, canonical URL, and page-specific title/description must remain consistent across the builder and information pages.
17. **One document accent model.** `template.accent` feeds `Layout`; preview, PDF, and DOCX must read the same value. Never introduce an independent export palette.
18. **One visible brand mark.** The header and favicons use the light artwork (`icon-192.png`, `favicon-*.png`) in both interface themes; the near-black `*-dark.png` variants are not used in the interface. Route every lookup through `themeAssets.ts`, and do not rename or alter the generated masters.
19. **One enclosing fence is a container, not content.** Both parsers strip exactly one complete enclosing `text` or unlabelled fence before reading markers. Never strip prose-wrapped, partial, or ambiguous fences, and never alter the interior.
20. **The Application Kit is orchestration, not a third document.** It reuses the same `resume` and `coverLetter` models, parsers, editors, layouts, formatting, and exporters. Never duplicate document content or parser rules.
21. **Kit builds are atomic.** Parse and validate both sections before replacing either model. A failed kit build must leave both previous documents untouched. Cross-document name or contact differences are warnings only; never rewrite them.
22. **Combined exports preserve document integrity.** Combined PDF follows the selected `ApplicationKitOrder` (default cover letter then resume), with each document on its own pages and selectable text. Combined DOCX follows the same order as one editable document: explicit page break when geometry matches, `nextPage` Word sections when page sizes or margins differ. Never concatenate ZIP files.
23. **Kit tabs are accessible and independent.** Resume and Cover Letter tabs use `tablist`/`tab`/`tabpanel`, arrow/Home/End navigation, and roving `tabIndex`. Switching tabs preserves edits and each document's own formatting and accent.
24. **One canonical kit sample.** `applicationKitSample.ts` supplies both the AI template's example and Load Example. Never add a second combined sample; select examples by `PrepareKind`, never by assuming every non-resume kind is a cover letter.
25. **Designs are presentation, not documents.** Ten résumé designs and four letter styles live in `src/lib/designs.ts`. A design supplies columns, font family, header/heading treatments, and scales; `layoutResume` and `layoutCoverLetter` apply the same block builders, pagination, metrics, accents, and exporters for every design. Switching designs must preserve every content value, never rewrite sections or columns, and never re-parse text. ATS Simple keeps a single full-width column, author order, and table-free DOCX. Never fork the pipeline per design, and never claim guaranteed ATS compatibility or hiring outcomes.
26. **Pagination is shared and automatic.** Heading blocks keep their first entry together; `template.pagination.keepEntriesTogether` (default on) moves whole entries when they fit a page; `section.startOnNewPage` forces a page break only when the page already has content. Oversized entries flow across pages without loss, and blank pages are never emitted. The preview, PDF, and DOCX all consume the same `Layout.pages`.
27. **Page counts are derived, never stored.** The workspace and kit read `layout.pages.length`; do not cache counts separately or compute them in components.
28. **Design switching and suggestions are user actions.** Application-context recommendations and letter-style suggestions are informational only. Never auto-switch a design or style, and never claim a recommendation predicts hiring outcomes.
29. **Combined order is session configuration.** `ApplicationKitOrder` lives in `App` state, not in either template. Combined PDF and DOCX must both honour it, preserve per-document page sizes, page breaks, accents, and text, and default to cover letter first. Separate downloads are unaffected.

## Working agreement

- Make focused changes and run `npm run check` plus `npm run format:check` before claiming completion.
- Add tests with behavior changes; both parsers, the combined kit parser, design switching and content preservation, gallery selection, section reordering, pagination controls, page counts, cover-letter styles, standalone and combined exports, preparation validation, AI instruction drift, coexisting session documents, kit atomicity and tab independence, public-page routing/session preservation, matching-letter reuse, legacy cleanup, theme persistence, and generated asset integrity are the critical surfaces.
- Manually check light and dark themes at 375px and desktop before calling UI work complete.
- Update `CHANGELOG.md` for user-visible changes and `VERSIONING.md` for version policy changes.
- Do not modify or audit other Kovina repositories from this project.
- `main` is protected: use a feature branch and PR, wait for the `check` status, then merge. Do not attempt direct pushes, force-pushes, or deletion.
- Do not deploy, tag, release, or merge without explicit permission.
