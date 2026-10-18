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

A client-only React + TypeScript + Vite resume builder. Structured text is imported, parsed deterministically, laid out in a fixed two-column template (US Letter default, plus A4 and US Legal), previewed, and exported as selectable-text PDF and editable DOCX. Importing is the primary entry point; manual editing follows.

## Current state (2026-10-18)

- **Published:** https://github.com/sparshsam/openresume — public, MIT.
- **Version:** v0.1.2, annotated tag, early-development pre-release.
- **CI:** `.github/workflows/ci.yml` runs lint, format check, typecheck, tests, and build.
- **Verification baseline:** `npm run check` and `npm run format:check`; 106 tests at v0.1.2.
- **README:** includes the canonical Kovina Collection footer.
- **Deployment:** https://openresume-sigma.vercel.app — Vercel project `openresume`, linked to GitHub `main`; PRs get preview deployments; default Vercel domain; no environment variables; no backend, accounts, analytics, or cloud storage. See `docs/deployment.md`.

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

- `src/App.tsx` — import/editor view state and wiring.
- `src/components/ImportScreen.tsx` — import-first entry view and validation.
- `src/components/Header.tsx` — brand, New/Import, Format, PDF/Word, theme slot.
- `src/components/ThemeProvider.tsx` / `src/lib/theme.ts` — light/dark/system theme.
- `src/components/Footer.tsx` / `src/lib/appMeta.ts` — Kovina attribution and version.
- `src/components/Icon.tsx` — inline SVG icons; no icon dependency.
- `docs/interface.md` — workflow, theme, responsive, and accessibility rules.
- `src/lib/parse.ts` — text → `Resume` (pure, deterministic); reports `documentCount`.
- `src/lib/serialize.ts` — `Resume` → text (round-trip).
- `src/lib/normalize.ts` — legacy draft/template upgrade and preset validation.
- `src/lib/metrics.ts` — page sizes and formatting presets → geometry and typography.
- `src/lib/measure.ts` — Helvetica AFM widths and wrapping.
- `src/lib/paginate.ts` — line-boundary pagination with keep-with-next.
- `src/lib/layout.ts` — flow blocks, header, page assembly.
- `src/lib/content.ts` — content strings for PDF/DOCX parity checks.
- `src/lib/exportPdf.ts` / `exportDocx.ts` — render the same `Layout`.
- `src/lib/storage.ts` — versioned `localStorage` draft.
- `src/components/FormattingPanel.tsx` — page size and spacing controls.
- `src/App.tsx` — state wiring only.

Full design: `ARCHITECTURE.md`.

## Non-negotiable rules

1. **One layout.** Preview and both exporters consume `layoutResume`. Never re-paginate in an exporter.
2. **Points everywhere.** Page geometry and typography use pt. CSS uses `pt`; jsPDF uses pt.
3. **Preserve content.** The parser must not summarize or rewrite text.
4. **No I/O.** No network, backend, auth, analytics, cloud storage, or AI. The only persistence is `localStorage`.
5. **Real text exports.** Never rasterize a page.
6. **Imports replace, never merge.** Keep the empty import screen and the multiple-heading rejection.
7. **Import-first, never fabricated.** No draft means the import screen, never a sample editor.
8. **Formatting flows through metrics.** Components and exporters consume `resolveMetrics`/`Layout`; never hard-code page geometry or spacing.
9. **Theme is interface-only.** Use tokens from `styles/tokens.css`; never theme the resume page, PDF, or DOCX.
10. **Minimal dependencies.** Runtime deps are React, jsPDF, and docx. Icons are inline SVG. Justify anything else.

## Working agreement

- Make focused changes and run `npm run check` before claiming completion.
- Add tests with behavior changes; parser, pagination, exports, import-first flow, and theme persistence are the critical surfaces.
- Manually check light and dark themes at 375px and desktop before calling UI work complete.
- Update `CHANGELOG.md` for user-visible changes and `VERSIONING.md` for version policy changes.
- Do not modify or audit other Kovina repositories from this project.
- Do not push or deploy without explicit permission.
