# Page sizes and formatting

OpenResume resolves every geometric and typographic value from the active document's `template` through `resolveMetrics()`. Resumes and cover letters each have their own template. The preview, PDF, and DOCX all consume the resulting layout, so a change is applied consistently.

Formatting is content-level: it stays with that document for the current session and is independent of the interface theme. Switching light/dark never changes page size, spacing, preview, PDF, or DOCX output.

## Page sizes

| Option              | Dimensions                        |
| ------------------- | --------------------------------- |
| US Letter (default) | 8.5 × 11 in — 612 × 792 pt        |
| A4                  | 210 × 297 mm — 595.28 × 841.89 pt |
| US Legal            | 8.5 × 14 in — 612 × 1008 pt       |

The preview header shows the selected size and the estimated page count.

## Controls

| Control           | Options                       | Shown for              | Effect                                                                     |
| ----------------- | ----------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| Resume layout     | Two-column / ATS Simple       | Resume                 | Switches the resume template without changing any content                  |
| Page margins      | Narrow / Normal / Wide        | Both                   | Side margins 28/44/58 pt; top and bottom 30/40/52 pt                       |
| Font size         | Small / Standard / Large      | Both                   | Scales name, headline, heading, body, and small text by 0.93 / 1.00 / 1.08 |
| Line spacing      | Compact / Standard / Relaxed  | Both                   | Body line height factor 1.22 / 1.37 / 1.52                                 |
| Section spacing   | Compact / Standard / Relaxed  | Both                   | Section separation: 12 / 16 / 22 pt before, 3.5 / 5 / 7 pt after           |
| Paragraph spacing | Compact / Standard / Relaxed  | Cover letter           | Space after each body paragraph: 4 / 8 / 14 pt, multiplied by density      |
| Bullet spacing    | Compact / Standard / Relaxed  | Resume                 | Space after each bullet                                                    |
| Column spacing    | Narrow / Standard / Wide      | Two-column resume only | Gap between the main and side columns: 14 / 22 / 32 pt                     |
| Content density   | Compact / Balanced / Spacious | Both                   | Multiplies vertical spacing by 0.82 / 1.00 / 1.22                          |
| Accent Colour     | Nine professional presets     | Both                   | Name, headings, decorative header rule, and other accent text              |

Only controls relevant to the selected document are shown. Cover letters are single-column and have no bullets, so those controls are hidden; paragraph spacing is shown only for letters. **Column spacing** is hidden for ATS Simple because that template has no second column.

## Resume layouts

| Layout                  | Columns | Reading order                            | Word output                 |
| ----------------------- | ------- | ---------------------------------------- | --------------------------- |
| Professional Two-Column | Two     | Main column, then side column            | One borderless table/page   |
| ATS Simple              | One     | Section order as authored, top to bottom | Linear paragraphs, no table |

Both layouts use the same parsers, section model, item formatting, accent palette, page sizes, and spacing controls. Only the geometry differs: ATS Simple gives every block the full content width and ignores each section's two-column `column` assignment (so the per-section Main/Side selector is hidden), while two-column resumes keep main and side blocks separate. Stored column assignments are preserved, so switching back restores them unchanged.

**ATS Simple** keeps conventional uppercase section headings, left-aligned linear text, real Word bullets, and no tables, positioned columns, text boxes, or images. Its combined Word export is a plain paragraph flow so text extraction sees the same order as the page.

ATS Simple reduces common parsing obstacles; it does not guarantee compatibility with any specific applicant tracking system. Recruiters and systems still read content, structure, and keywords, so the strongest improvement remains clear, conventional writing.

Switching layouts never changes content, edits, page size, accent, or spacing presets. The layout is stored in `template.layout`, defaults to `twoColumn`, and resets to it with **Reset to defaults**.

## Typography

| Element         | Standard size | Leading             |
| --------------- | ------------- | ------------------- |
| Name            | 23 pt         | 1.17                |
| Headline        | 10.5 pt       | 1.24                |
| Section heading | 10 pt         | 1.30                |
| Body            | 9.2 pt        | 1.37 × line spacing |
| Secondary text  | 8.8 pt        | 1.38                |

Secondary text covers contact lines, dates, and locations. It is set at 8.8 pt with darker muted ink (`#4A4A4A`, AAA contrast on white) so dates and locations stay readable in print and on screen. Experience entries begin 9 pt apart at balanced density, and section separation is more generous so scans land on the right section.

Every size comes from `resolveMetrics()`, so the preview, PDF, and DOCX receive the same values. DOCX converts points to half-points and twips; rounding is the only difference.

### Accent colour

Choose from a restrained, print-friendly palette:

| Name            | Value     |
| --------------- | --------- |
| Green (default) | `#14532D` |
| Blue            | `#1D4ED8` |
| Navy            | `#1E3A5F` |
| Teal            | `#0F766E` |
| Purple          | `#5B21B6` |
| Red             | `#991B1B` |
| Orange          | `#9A3412` |
| Brown           | `#78350F` |
| Charcoal        | `#374151` |

The swatch group is a native radio group with accessible colour names, arrow-key navigation, a visible selected marker, and a focus ring that works in both interface themes. The selected colour name is also displayed in text.

The accent is stored in each document's `template.accent`. `layoutResume` and `layoutCoverLetter` use that value for the header name, header rule, and resume section headings. The preview and PDF read the resulting `Layout` line colours directly; DOCX uses the same `Layout.accent` and heading line colours. There is no separate export palette.

The accent is independent per document and remains with the in-memory document during navigation and replacement builds. It is not persisted. **Reset to defaults** restores Green along with the other formatting presets.

### Density composition

Density is a vertical-rhythm multiplier, not an override. A `Relaxed` section spacing with `Compact` density is still more generous than `Compact` section spacing with `Compact` density. This avoids contradictory presets: every control has one job.

### Column geometry

Resume content width is `page width − 2 × side margin`. The main column keeps roughly 63% of the content width; the gap comes from the column-spacing control; the side column takes the remainder. If a combination would push the side column below 100 pt, the gap is reduced first.

Cover letters use the full content width as a single column.

## Session behavior

Formatting lives in each document's `template` in memory:

- It survives navigation and replacement builds while the page stays open; the current template is preserved when new content replaces the document.
- Changing one document's formatting never changes the other's.
- It does not survive a reload, and it is never written to `localStorage` along with the document.
- Loading a legacy stored document is no longer part of the application; the old draft entries are removed when identified.

**Reset to defaults** restores US Letter, the Green accent, the Professional Two-Column layout, and every standard preset for the active document.

## Legacy templates

Resume templates created by v0.1.0–v0.1.2 may have `pageSize` and `accent` but no complete format. `normalizeTemplate` still fills missing or invalid settings with defaults—including `paragraphSpacing: standard`—while preserving a valid existing page size. Unknown or invalid presets always fall back to safe defaults.
