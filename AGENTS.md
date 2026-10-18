# OpenResume — AI Agent Operating Notes

This file complements `CLAUDE.md`. Read both before changing code.

## Mission

Produce consistent, professional resumes from structured text with zero data leaving the browser. Optimize for fast repeated use, not multi-user features.

## Invariants to preserve

- The preview and the two exports share one `Layout`.
- Pagination never duplicates or drops a line.
- Content is preserved unless the user edits it.
- No runtime network calls and no storage beyond `localStorage`.
- PDF text is selectable; DOCX text is editable.

## Where to change what

| Task                        | Touch                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| Parsing rules or aliases    | `src/lib/parse.ts`, `docs/input-format.md`, `tests/parse.test.ts`      |
| Round-trip format           | `src/lib/serialize.ts`, `tests/serialize.test.ts`                      |
| Typography, margins, colors | `src/lib/tokens.ts`, `src/styles/tokens.css`                           |
| Wrapping and metrics        | `src/lib/measure.ts`, `tests/layout.test.ts`                           |
| Page breaks, keep-with-next | `src/lib/paginate.ts`, `tests/paginate.test.ts`                        |
| Column composition          | `src/lib/layout.ts`                                                    |
| PDF output                  | `src/lib/exportPdf.ts`, `tests/exportPdf.test.ts`                      |
| DOCX output                 | `src/lib/exportDocx.ts`, `tests/exportDocx.test.ts`                    |
| Draft storage or schema     | `src/lib/storage.ts`, `src/hooks/useDraft.ts`, `tests/storage.test.ts` |
| Editor controls             | `src/components/EditorPanel.tsx`, `SectionEditor.tsx`                  |
| Toolbar and import flow     | `src/components/Toolbar.tsx`, `ImportDialog.tsx`                       |

## Verification before completion

```bash
npm run check
```

Then, for export-affecting changes, manually export a PDF and DOCX and confirm:

- PDF text can be selected.
- DOCX opens and paragraphs are editable.
- Page count matches the preview.

## Change discipline

- Keep pure logic in `src/lib/`; keep components thin.
- Prefer adding a test to editing an existing one.
- Do not introduce abstractions for hypothetical templates or backends.
- Record limitations rather than hiding them.
- Do not push, tag, or deploy without explicit permission.
