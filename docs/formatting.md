# Page sizes and formatting

OpenResume resolves every geometric and typographic value from the active document's `template` through `resolveMetrics()`. Resumes and cover letters each have their own template. The preview, PDF, and DOCX all consume the resulting layout, so a change is applied consistently.

Formatting is content-level: it stays with that document for the current session and is independent of the interface theme. Switching light/dark never changes page size, spacing, preview, PDF, or DOCX output.

## Page sizes

| Option              | Dimensions                        |
| ------------------- | --------------------------------- |
| US Letter (default) | 8.5 × 11 in — 612 × 792 pt        |
| A4                  | 210 × 297 mm — 595.28 × 841.89 pt |
| US Legal            | 8.5 × 14 in — 612 × 1008 pt       |

The preview header shows the selected size and the exact page count.

## The Format drawer

**Format** opens a compact, non-modal drawer docked to the left of the workspace. It is a fixed panel, not a block in the document flow, so opening it never pushes the preview or the résumé down. The drawer keeps the résumé preview visible on desktop and becomes a full-screen sheet with a dismiss backdrop under 720 px.

The drawer separates its two jobs into tabs:

- **Designs** — the résumé design gallery, or the four letter styles for a cover letter.
- **Formatting** — page, typography, spacing, accent, and pagination controls.

The tablist supports arrow-key navigation. The drawer has a close button, closes on Escape, and returns focus to the **Format** button when it closes. The accent swatches are in **Formatting**, and **Reset to defaults** stays in the drawer footer so it is always reachable.

## Controls

| Control               | Options                                | Shown for              | Effect                                                                                                |
| --------------------- | -------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| Browse Designs        | Ten résumé designs                     | Resume                 | Switches the document composition — header, columns, headings, and entries — without changing content |
| Letter style          | Classic / Modern / Executive / Minimal | Cover letter           | Switches the letter's header, font family, and subject treatment                                      |
| Application context   | Five optional contexts                 | Resume                 | Highlights suggested designs; never switches automatically                                            |
| Keep entries together | On / Off                               | Resume                 | Moves a whole entry to the next page when it fits there                                               |
| Page margins          | Narrow / Normal / Wide                 | Both                   | Side margins 28/44/58 pt; top and bottom 30/40/52 pt                                                  |
| Font size             | Small / Standard / Large               | Both                   | Scales name, headline, heading, body, and small text by 0.93 / 1.00 / 1.08                            |
| Line spacing          | Compact / Standard / Relaxed           | Both                   | Body line height factor 1.22 / 1.37 / 1.52                                                            |
| Section spacing       | Compact / Standard / Relaxed           | Both                   | Section separation: 12 / 16 / 22 pt before, 3.5 / 5 / 7 pt after                                      |
| Paragraph spacing     | Compact / Standard / Relaxed           | Cover letter           | Space after each body paragraph: 4 / 8 / 14 pt, multiplied by density                                 |
| Bullet spacing        | Compact / Standard / Relaxed           | Resume                 | Space after each bullet                                                                               |
| Column spacing        | Narrow / Standard / Wide               | Two-column resume only | Gap between the main and side columns: 14 / 22 / 32 pt                                                |
| Content density       | Compact / Balanced / Spacious          | Both                   | Multiplies vertical spacing by 0.82 / 1.00 / 1.22                                                     |
| Accent Colour         | Nine professional presets              | Both                   | Name, headings, decorative header rule, and other accent text                                         |

Only controls relevant to the selected document are shown. Cover letters are single-column and have no bullets, so those controls are hidden; paragraph spacing and letter style are shown only for letters. **Column spacing** is hidden for single-column designs, and the per-section Main/Side selector is hidden whenever the active design has one column.

## Résumé designs

| Design                  | Layout     | Identity block                               | Section headings                   | Entries                           | Font      |
| ----------------------- | ---------- | -------------------------------------------- | ---------------------------------- | --------------------------------- | --------- |
| Professional Two-Column | Balanced   | Left, rule under the contact line            | Plain uppercase accent text        | Stacked title, subtitle, metadata | Helvetica |
| ATS Simple              | Linear     | Left, rule under the contact line            | Plain uppercase accent text        | Stacked; table-free Word output   | Helvetica |
| Executive               | Linear     | Centered serif masthead with a double rule   | Uppercase, underlined              | Dates aligned to the right        | Times     |
| Modern Minimal          | Linear     | Split: name and headline left, contact right | Quiet trailing rules               | Dates aligned to the right        | Helvetica |
| Classic                 | Linear     | Centered serif identity with a double rule   | Centered, framed with fine rules   | Dates aligned to the right        | Times     |
| Creative                | Left rail  | Oversized stacked identity                   | Thick accent bars                  | Stacked entries                   | Helvetica |
| Compact                 | Balanced   | Compact identity with a right tinted rail    | Small accent bars                  | Inline dates, dense spacing       | Helvetica |
| Academic                | Linear     | Split identity; dates in a left margin       | Fine underlined headings           | Dated left gutter, indented body  | Times     |
| Contemporary            | Right rail | Accent banner header                         | Top rules                          | Dates aligned to the right        | Helvetica |
| Bold                    | Linear     | Solid accent banner                          | Filled accent bands, reversed text | Dates aligned to the right        | Helvetica |

Each design is a registry entry that supplies a page arrangement (`linear`, `balanced`, `sidebarLeft`, `sidebarRight`), a header variant (`stacked`, `centered`, `split`, `banner`, `compact`), a heading decoration (`none`, `underline`, `trailing`, `bar`, `fill`, `topRule`, `boxed`), an entry layout (`stacked`, `titleRow`, `gutter`), a sidebar treatment, a font family, and typographic and spacing scales. Content, measurement, pagination, preview, and both exporters are shared; a design changes composition, never the document model. Switching designs preserves every section, entry, field, bullet, accent, page size, and spacing preset, and stores the previous design for switching back.

**ATS Simple** keeps conventional uppercase section headings, left-aligned linear text, real Word bullets, and no tables, positioned columns, text boxes, or images. Its combined Word export is a plain paragraph flow so text extraction sees the same order as the page.

ATS Simple reduces common parsing obstacles; it does not guarantee compatibility with any specific applicant tracking system. Recruiters and systems still read content, structure, and keywords, so the strongest improvement remains clear, conventional writing. No design or recommendation predicts hiring outcomes.

The design is stored in `template.layout`. It defaults to `twoColumn` and resets to it with **Reset to defaults**. Single-column designs ignore each section's stored `column` value without rewriting it, so returning to a two-column design restores the original placement.

## Letter styles

Classic Letter is the default and reproduces the original letter layout. Modern Letter enlarges the name, removes the header rule, and accents the subject line. Executive Letter uses Times, a centered identity block, and a fine rule. Minimal Letter is compact, text-coloured, and rule-free. The selected style is stored in `template.letterStyle` and is independent of the resume design. When a résumé design is active, the letter panel suggests a coordinated style you can apply with one click; nothing changes until you choose it.

## Pagination

Automatic pagination remains the default:

- A section heading always stays with its first entry when the pair fits on a page.
- **Keep entries together** (on by default) moves a whole entry to the next page when it fits there, instead of splitting it across a page boundary. Turning it off restores natural flow splitting.
- A section's **New page** checkbox starts that section on a fresh page. It never creates a blank page when the section already begins a page.
- An entry taller than one page still flows across pages; no content is clipped or dropped.
- Trailing empty pages are removed, and page indexes are always contiguous.

Pagination is computed once in the shared layout and reused by the preview, PDF, and DOCX, so the page count shown in the workspace matches the exported document.

## Page counts

The workspace header shows the active document's page count. In the Application Kit, the toolbar shows both counts independently, for example `Resume: 2 pages | Cover Letter: 1 page`. Counts update as content, formatting, pagination settings, or designs change.

## Typography

| Element         | Standard size | Leading             |
| --------------- | ------------- | ------------------- |
| Name            | 23 pt         | 1.17                |
| Headline        | 10.5 pt       | 1.24                |
| Section heading | 10 pt         | 1.30                |
| Body            | 9.2 pt        | 1.37 × line spacing |
| Secondary text  | 8.8 pt        | 1.38                |

These are the base values for the default design; each design applies its own scale factors on top of them before the user's font-size, spacing, and density presets are applied. Secondary text covers contact lines, dates, and locations at 8.8 pt with darker muted ink (`#4A4A4A`) so dates and locations stay readable in print and on screen.

Every size comes from `resolveMetrics()`, so the preview, PDF, and DOCX receive the same values. DOCX converts points to half-points and twips; rounding is the only difference. Helvetica and Times are PDF standard fonts; Word receives Helvetica and Times New Roman, which are metrically compatible for these designs.

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

The accent is stored in each document's `template.accent`. `layoutResume` and `layoutCoverLetter` use that value wherever the active design assigns an accent role: the header name, header rule, section headings, heading rules, or subject line. Designs may instead use text or muted ink for a role, which keeps each design's palette intentional while remaining adjustable. The preview and PDF read the resulting `Layout` line colours directly; DOCX uses the same line and border colours. There is no separate export palette.

The accent is independent per document and remains with the in-memory document during navigation and replacement builds. It is not persisted. **Reset to defaults** restores Green along with the other formatting presets.

### Density composition

Density is a vertical-rhythm multiplier, not an override. A `Relaxed` section spacing with `Compact` density is still more generous than `Compact` section spacing with `Compact` density. This avoids contradictory presets: every control has one job.

### Column geometry

Resume content width is `page width − 2 × side margin`. The main column keeps roughly 63% of the content width in Professional Two-Column, 62% in Creative, 66% in Compact, and 68% in Contemporary; the gap comes from the column-spacing control; the side column takes the remainder. If a combination would push the side column below 100 pt, the gap is reduced first. Sidebar designs draw a document-level tint and, where configured, a divider rule in the gap; both exports use the same resolved colour.

Cover letters use the full content width as a single column.

## Session behavior

Formatting lives in each document's `template` in memory:

- It survives navigation and replacement builds while the page stays open; the current template is preserved when new content replaces the document.
- Changing one document's formatting never changes the other's.
- It does not survive a reload, and it is never written to `localStorage` along with the document.
- Loading a legacy stored document is no longer part of the application; the old draft entries are removed when identified.

**Reset to defaults** restores US Letter, the Green accent, Professional Two-Column, Classic Letter, keep-entries-together pagination, and every standard preset for the active document.

## Legacy templates

Resume templates created by earlier versions may have `pageSize` and `accent` but no complete format, design, letter style, or pagination settings. `normalizeTemplate` fills every missing or invalid field with a default—`twoColumn`, `classic`, and `keepEntriesTogether: true`—while preserving valid values. Unknown design or style ids always fall back to those defaults, so older in-memory templates keep rendering safely.
