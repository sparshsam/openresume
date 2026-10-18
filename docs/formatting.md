# Page sizes and formatting

OpenResume resolves every geometric and typographic value from `Resume.template` through `resolveMetrics()`. The preview, PDF, and DOCX all consume the resulting layout, so a change is applied consistently.

## Page sizes

| Option              | Dimensions                        |
| ------------------- | --------------------------------- |
| US Letter (default) | 8.5 × 11 in — 612 × 792 pt        |
| A4                  | 210 × 297 mm — 595.28 × 841.89 pt |
| US Legal            | 8.5 × 14 in — 612 × 1008 pt       |

The preview header shows the selected size and the estimated page count.

## Controls

| Control         | Options                       | Effect                                                                     |
| --------------- | ----------------------------- | -------------------------------------------------------------------------- |
| Page margins    | Narrow / Normal / Wide        | Side margins 28/44/58 pt; top and bottom 30/40/52 pt                       |
| Font size       | Small / Standard / Large      | Scales name, headline, heading, body, and small text by 0.93 / 1.00 / 1.08 |
| Line spacing    | Compact / Standard / Relaxed  | Body line height factor 1.22 / 1.37 / 1.52                                 |
| Section spacing | Compact / Standard / Relaxed  | Space before and after section headings                                    |
| Bullet spacing  | Compact / Standard / Relaxed  | Space after each bullet                                                    |
| Column spacing  | Narrow / Standard / Wide      | Gap between the main and side columns: 14 / 22 / 32 pt                     |
| Content density | Compact / Balanced / Spacious | Multiplies vertical spacing by 0.82 / 1.00 / 1.22                          |

### Density composition

Density is a vertical-rhythm multiplier, not an override. A `Relaxed` section spacing with `Compact` density is still more generous than `Compact` section spacing with `Compact` density. This avoids contradictory presets: every control has one job.

### Column geometry

The content width is `page width − 2 × side margin`. The main column keeps roughly 63% of the content width; the gap comes from the column-spacing control; the side column takes the remainder. If a combination would push the side column below 100 pt, the gap is reduced first.

## Persistence

Formatting lives in `Resume.template` and is saved with the draft under `openresume:draft.v1`. It survives:

- page reloads (the draft is loaded and normalized),
- imports (the current template is preserved when new content replaces the document),
- **Reset sample** (content is replaced; the current formatting is kept).

**Reset to defaults** restores US Letter and every standard preset.

## Legacy drafts

Drafts created by v0.1.0 have a template with `pageSize` and `accent` but no `format`. On load, missing or invalid settings are filled with defaults while a valid existing page size is preserved. The same normalization is applied in tests.
