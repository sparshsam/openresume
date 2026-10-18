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

| Control           | Options                       | Shown for    | Effect                                                                     |
| ----------------- | ----------------------------- | ------------ | -------------------------------------------------------------------------- |
| Page margins      | Narrow / Normal / Wide        | Both         | Side margins 28/44/58 pt; top and bottom 30/40/52 pt                       |
| Font size         | Small / Standard / Large      | Both         | Scales name, headline, heading, body, and small text by 0.93 / 1.00 / 1.08 |
| Line spacing      | Compact / Standard / Relaxed  | Both         | Body line height factor 1.22 / 1.37 / 1.52                                 |
| Section spacing   | Compact / Standard / Relaxed  | Both         | Resume heading spacing; cover letter block spacing                         |
| Paragraph spacing | Compact / Standard / Relaxed  | Cover letter | Space after each body paragraph: 4 / 8 / 14 pt, multiplied by density      |
| Bullet spacing    | Compact / Standard / Relaxed  | Resume       | Space after each bullet                                                    |
| Column spacing    | Narrow / Standard / Wide      | Resume       | Gap between the main and side columns: 14 / 22 / 32 pt                     |
| Content density   | Compact / Balanced / Spacious | Both         | Multiplies vertical spacing by 0.82 / 1.00 / 1.22                          |

Only controls relevant to the selected document are shown. Cover letters are single-column and have no bullets, so those controls are hidden; paragraph spacing is shown only for letters.

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

**Reset to defaults** restores US Letter and every standard preset for the active document.

## Legacy templates

Resume templates created by v0.1.0–v0.1.2 may have `pageSize` and `accent` but no complete format. `normalizeTemplate` still fills missing or invalid settings with defaults—including `paragraphSpacing: standard`—while preserving a valid existing page size. Unknown or invalid presets always fall back to safe defaults.
