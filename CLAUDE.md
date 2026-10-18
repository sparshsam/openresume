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

A client-only React + TypeScript + Vite resume and cover letter builder. Structured text is prepared, parsed deterministically, laid out (two columns for resumes, one for cover letters; US Letter default plus A4 and US Legal), previewed, and exported as selectable-text PDF and editable DOCX.

## Current state (2026-10-18)

- **Published:** https://github.com/sparshsam/openresume — public, MIT.
- **Version:** v0.1.6 branding and housekeeping release, committed locally. Production still serves v0.1.5 at https://resume.kovina.org until publication approval.
- **CI:** `.github/workflows/ci.yml` runs lint, format check, typecheck, tests, and build.
- **Verification baseline:** `npm run check` and `npm run format:check`; see the latest full run for the test count.
- **README:** includes the canonical Kovina Collection footer.
- **Deployment:** https://resume.kovina.org is the primary production address; the original Vercel deployment remains at https://openresume-sigma.vercel.app. Vercel project `openresume`, linked to GitHub `main`; PRs get preview deployments; no environment variables; no backend, accounts, analytics, or cloud storage. See `docs/deployment.md`.

**For future sessions:** read `CLAUDE.md` and `AGENTS.md` first to get oriented, then **wait for Sparsh's instructions** before editing, committing, pushing, tagging, releasing, or deploying. Do not push or deploy without explicit approval.

**Known notes:** `/releases/latest` returns 404 while the only release is a pre-release; this is expected until a stable release exists. The repository wiki is enabled but empty. Pushing to `main` triggers a Vercel production deployment; PRs get preview deployments, which are SSO-protected while production is public.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # typecheck + production build → dist/
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest
npm run check        # everything above, in release order
```

## Architecture map

- `src/App.tsx` — landing/prepare/workspace state and both documents.
- `src/components/LandingPage.tsx` — two-card document selection with Build and session Open actions.
- `src/components/ToastRegion.tsx` — dismissible success and error notifications.
- `src/components/PrepareScreen.tsx` — shared preparation, validation, AI copy, examples.
- `src/components/Header.tsx` — brand/home, New, Format, PDF/Word, document label, theme.
- `src/components/ThemeProvider.tsx` / `src/lib/theme.ts` — light/dark/system theme.
- `src/components/Footer.tsx` / `src/lib/appMeta.ts` — Kovina attribution and version.
- `assets/branding/source-assets/` — authoritative light/dark logo masters.
- `scripts/generate-icons.py` — reproduces every icon and social asset from those masters.
- `docs/branding.md` — asset inventory, standards, and generation pipeline.
- `src/components/Icon.tsx` — inline SVG icons; no icon dependency.
- `docs/interface.md` — workflow, navigation, theme, responsive, and accessibility rules.
- `src/lib/parse.ts` — text → `Resume` (pure, deterministic); reports `documentCount`.
- `src/lib/parseCoverLetter.ts` — text → `CoverLetter`; reports `documentCount`.
- `src/lib/contact.ts` — shared contact-line classification.
- `src/lib/serialize.ts` — `Resume` → text (round-trip).
- `src/lib/normalize.ts` — legacy template upgrade and preset validation.
- `src/lib/metrics.ts` — page sizes and formatting presets → geometry and typography.
- `src/lib/measure.ts` — Helvetica AFM widths and wrapping.
- `src/lib/paginate.ts` — line-boundary pagination with keep-with-next.
- `src/lib/layout.ts` — resume flow blocks, header, page assembly.
- `src/lib/coverLetterLayout.ts` — single-column letter layout.
- `src/lib/coverLetterEdits.ts` / `coverLetterScaffold.ts` — letter edits and resume-detail reuse.
- `src/lib/aiInstructions.ts` — parser-generated AI instruction templates.
- `src/lib/content.ts` — content strings for PDF/DOCX parity checks.
- `src/lib/exportPdf.ts` / `exportDocx.ts` — render either document's `Layout`.
- `src/lib/storage.ts` — validated one-time cleanup of v0.1.x draft entries.
- `src/components/FormattingPanel.tsx` — document-specific formatting controls.
- `src/App.tsx` — state wiring only.

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

## Working agreement

- Make focused changes and run `npm run check` before claiming completion.
- Add tests with behavior changes; both parsers, pagination, exports, preparation validation, AI instruction drift, coexisting session documents, matching-letter reuse, legacy cleanup, theme persistence, and generated asset integrity are the critical surfaces.
- Manually check light and dark themes at 375px and desktop before calling UI work complete.
- Update `CHANGELOG.md` for user-visible changes and `VERSIONING.md` for version policy changes.
- Do not modify or audit other Kovina repositories from this project.
- Do not push or deploy without explicit permission.
