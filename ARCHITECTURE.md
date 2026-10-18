# Architecture

OpenResume is a client-only React application. Its correctness lives in a pure, testable pipeline that runs before anything touches the DOM.

## Invariants

1. **One layout, three consumers.** The preview, PDF, and DOCX all render from the same `Layout` produced by `layoutResume`. No exporter re-computes pagination.
2. **Points are the unit.** Page geometry, typography, and coordinates are expressed in PostScript points. CSS renders the same numbers with `pt` units; jsPDF consumes them directly.
3. **Content is preserved.** The parser never rewrites, summarizes, or normalizes user text beyond structural whitespace. Only explicit edits change content.
4. **No hidden I/O.** There are no runtime network calls, no server, and no telemetry. The only persistence is `localStorage`.
5. **Exports contain real text.** Pages are never rasterized. PDF text is selectable; DOCX paragraphs are editable.

## Pipeline

```mermaid
flowchart LR
  A[Structured text] --> B[parseResume]
  B --> C[Resume model]
  C --> D[measure + wrap]
  D --> E[flow blocks]
  E --> F[paginateColumn]
  F --> G[Layout: pages + absolute lines]
  G --> H[Preview]
  G --> I[exportPdf]
  G --> J[exportDocx]
  C --> K[localStorage draft v1]
```

## Modules

| Module                   | Responsibility                                       | Must not                     |
| ------------------------ | ---------------------------------------------------- | ---------------------------- |
| `src/lib/parse.ts`       | Deterministic text → `Resume`; warnings, no throwing | Know about React or layout   |
| `src/lib/serialize.ts`   | `Resume` → canonical input text (round-trip)         | Lose information             |
| `src/lib/measure.ts`     | Helvetica AFM metrics and greedy word wrap           | Depend on the DOM            |
| `src/lib/paginate.ts`    | Flow blocks → pages at line boundaries               | Drop or duplicate lines      |
| `src/lib/layout.ts`      | Build flow blocks, header, page assembly             | Render or export             |
| `src/lib/exportPdf.ts`   | Draw `Layout` with jsPDF as selectable text          | Recalculate pagination       |
| `src/lib/exportDocx.ts`  | Build a DOCX table per logical page                  | Rasterize or flatten text    |
| `src/lib/storage.ts`     | Versioned, guarded draft persistence                 | Throw on unavailable storage |
| `src/lib/resumeEdits.ts` | Pure immutable edit helpers                          | Mutate inputs                |
| `src/hooks/useDraft.ts`  | Load, debounce-save, reset                           | Hold layout state            |
| `src/App.tsx`            | Wire state, exports, dialogs                         | Contain layout logic         |

## Data model

`Resume` is the single source of truth (`src/types/resume.ts`):

- `header` — name and headline.
- `contact` — email, phone, location, and labeled links.
- `sections[]` — ordered sections with `kind`, `column` (`main`/`side`), `enabled`, and `items[]`.
- `items[]` — title, subtitle, date range, location, body, and bullets.
- `template` — page size and accent.

Section IDs and parser-created item IDs are deterministic, so repeated parses of the same text produce deep-equal models.

## Layout and pagination

- Page: A4, 595.28 × 841.89 pt; 44 pt side margins, 40 pt top/bottom margins.
- Two independent columns: 320 pt main, 22 pt gap, 165.28 pt side.
- The header occupies the top 100 pt of page 1; both columns start below it.
- Text width is computed from embedded Helvetica AFM widths, which match the PDF's built-in font metrics. This makes wrapping deterministic and independent of the browser's font rendering.
- `paginateColumn` places atomic blocks whole, splits paragraphs and bullet runs at line boundaries, and honours `keepWithNext` for headings and item headers.
- Page count is `max(mainPages, sidePages)`; an empty column on a later page is valid.

## Exports

**PDF.** jsPDF in `pt` units, Helvetica normal/bold, no compression, real text runs at the computed baselines. Page count always equals `Layout.pages.length`.

**DOCX.** The `docx` package builds one no-border, three-column table per logical page (main, gap, side) with exact line spacing and indentation from the layout. Page breaks separate logical pages. Text remains editable, though Word may re-flow within a page after edits.

Both exporters are loaded with dynamic `import()` so the initial bundle stays small.

## State and persistence

- `useDraft` initializes from `loadDraft()` or the sample resume.
- Saves are debounced by 400 ms and flushed on `visibilitychange`.
- Storage is versioned (`openresume:draft.v1`) and structurally validated with `isResume`. Corrupt or unsupported payloads fall back to the sample.
- `clearDraft()` runs before resetting to the sample.

## Dependency policy

Runtime dependencies are limited to:

- `react`, `react-dom` — UI.
- `jspdf` — text-based PDF generation.
- `docx` — editable document generation.

No state library, router, CSS framework, parser library, or storage wrapper. Add a dependency only when it removes more code than it introduces and does not compromise the invariants above.

## Testing

- Parser, serializer, measurement, pagination, layout, edits, storage, and exports have focused unit tests.
- The long-resume test asserts every bullet appears exactly once across pages.
- Export tests assert `%PDF`, page count, real text presence, ZIP magic bytes, and text inclusion.
- Component tests cover editing, section toggling, import, adding sections, and persistence.

## Extension points

- **Page size.** Add a `pageSize` branch in `tokens.ts` and pass dimensions through `layoutResume`.
- **Templates.** Introduce a template profile that supplies tokens, column ratios, and section defaults; do not fork the pipeline.
- **Fonts.** Replace the embedded width tables with a font that is embedded in both the browser and the PDF, keeping measurement and rendering identical.

## Non-goals for v0.1.0

Multi-user accounts, cloud sync, AI generation, PDF/DOCX import, cover letters, and multi-template galleries.
