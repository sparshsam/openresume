# OpenResume — AI Agent Operating Notes

This file complements `CLAUDE.md`. Read both before changing code.

## Current state (2026-10-18)

- **Published:** https://github.com/sparshsam/openresume — public, MIT.
- **Release:** v0.1.2 tag and early-development pre-release are live; CI is green.
- **README:** includes the full Kovina Collection footer.
- **Repository:** all work is committed and the working tree is clean.
- **Deployment:** no Vercel deployment, backend, authentication, analytics, or cloud storage.

**Handoff:** read `CLAUDE.md` and `AGENTS.md` first to get oriented, then **wait for Sparsh's instructions** before making changes. Do not push, tag, release, or deploy without explicit permission.

**Start here:** `ARCHITECTURE.md`, `docs/interface.md`, `docs/input-format.md`, and `docs/formatting.md`. `/releases/latest` is expected to return 404 while the only release is a pre-release; the wiki is enabled but empty.

## Mission

Produce consistent, professional resumes from structured text with zero data leaving the browser. Optimize for fast repeated use, not multi-user features.

## Invariants to preserve

- The preview and the two exports share one `Layout`.
- Pagination never duplicates or drops a line, and no blank pages are emitted.
- Content is preserved unless the user edits it.
- Imports replace the whole document; multiple top-level headings are rejected.
- No draft means the import screen; the app never fabricates a document.
- Page size and formatting flow through `resolveMetrics`; no component hard-codes geometry.
- Interface themes never change the resume page, PDF, or DOCX colors.
- No runtime network calls and no storage beyond `localStorage`.
- PDF text is selectable; DOCX text is editable and contains every content string.

## Where to change what

| Task                        | Touch                                                                            |
| --------------------------- | -------------------------------------------------------------------------------- |
| Parsing rules or aliases    | `src/lib/parse.ts`, `docs/input-format.md`, `tests/parse.test.ts`                |
| Round-trip format           | `src/lib/serialize.ts`, `tests/serialize.test.ts`                                |
| Page geometry, typography   | `src/lib/metrics.ts`, `src/styles/tokens.css`                                    |
| Document colors             | `src/lib/tokens.ts`                                                              |
| Wrapping and metrics        | `src/lib/measure.ts`, `tests/layout.test.ts`                                     |
| Page breaks, keep-with-next | `src/lib/paginate.ts`, `tests/paginate.test.ts`                                  |
| Column composition          | `src/lib/layout.ts`                                                              |
| PDF output                  | `src/lib/exportPdf.ts`, `tests/exportPdf.test.ts`                                |
| DOCX output                 | `src/lib/exportDocx.ts`, `tests/exportDocx.test.ts`                              |
| Draft storage or schema     | `src/lib/storage.ts`, `src/hooks/useDraft.ts`, `tests/storage.test.ts`           |
| Page sizes or formatting    | `src/lib/metrics.ts`, `src/components/FormattingPanel.tsx`, `docs/formatting.md` |
| Import integrity            | `src/lib/parse.ts` (`documentCount`), `ImportScreen.tsx`, `tests/App.test.tsx`   |
| Import-first shell          | `src/App.tsx`, `src/hooks/useDraft.ts`, `ImportScreen.tsx`, `Header.tsx`         |
| Theme (light/dark/system)   | `src/lib/theme.ts`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, `styles/tokens.css`  |
| Footer and version          | `src/components/Footer.tsx`, `src/lib/appMeta.ts`, `vite.config.ts`              |
| Icons                       | `src/components/Icon.tsx` — inline SVG only                                      |
| PDF/DOCX content parity     | `src/lib/content.ts`, export tests                                               |
| Editor controls             | `src/components/EditorPanel.tsx`, `SectionEditor.tsx`                            |
| Header and import flow      | `src/components/Header.tsx`, `ImportScreen.tsx`                                  |

## Verification before completion

```bash
npm run check
```

Then, for export-affecting changes, manually export a PDF and DOCX and confirm:

- PDF text can be selected.
- DOCX opens and paragraphs are editable.
- Page count matches the preview on US Letter, A4, and US Legal.
- A second import replaces the first document entirely.
- Formatting changes appear in the preview and both exports.
- First launch shows the import screen; a saved draft opens the editor.
- New/Import preserve the draft until a successful replacement.
- Light, dark, and system themes work; the resume page keeps fixed colors.
- Header and footer remain usable at 375px.

## Change discipline

- Keep pure logic in `src/lib/`; keep components thin.
- Prefer adding a test to editing an existing one.
- Do not introduce abstractions for hypothetical templates or backends.
- Record limitations rather than hiding them.
- Do not push, tag, or deploy without explicit permission.
