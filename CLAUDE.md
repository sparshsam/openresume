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

A client-only React + TypeScript + Vite resume builder. Structured text is parsed deterministically, laid out in a fixed two-column A4 template, previewed, and exported as selectable-text PDF and editable DOCX.

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

- `src/lib/parse.ts` — text → `Resume` (pure, deterministic).
- `src/lib/serialize.ts` — `Resume` → text (round-trip).
- `src/lib/measure.ts` — Helvetica AFM widths and wrapping.
- `src/lib/paginate.ts` — line-boundary pagination.
- `src/lib/layout.ts` — flow blocks, header, page assembly.
- `src/lib/exportPdf.ts` / `exportDocx.ts` — render the same `Layout`.
- `src/lib/storage.ts` — versioned `localStorage` draft.
- `src/App.tsx` — state wiring only.

Full design: `ARCHITECTURE.md`.

## Non-negotiable rules

1. **One layout.** Preview and both exporters consume `layoutResume`. Never re-paginate in an exporter.
2. **Points everywhere.** Page geometry and typography use pt. CSS uses `pt`; jsPDF uses pt.
3. **Preserve content.** The parser must not summarize or rewrite text.
4. **No I/O.** No network, backend, auth, analytics, cloud storage, or AI. The only persistence is `localStorage`.
5. **Real text exports.** Never rasterize a page.
6. **Minimal dependencies.** Runtime deps are React, jsPDF, and docx. Justify anything else.

## Working agreement

- Make focused changes and run `npm run check` before claiming completion.
- Add tests with behavior changes; parser, pagination, and exports are the critical surfaces.
- Update `CHANGELOG.md` for user-visible changes and `VERSIONING.md` for version policy changes.
- Do not modify or audit other Kovina repositories from this project.
- Do not push or deploy without explicit permission.
