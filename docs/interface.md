# Interface

OpenResume is a document production workspace, not a form-first resume builder. Importing is the primary path; manual editing remains fully available after import.

## First launch

With no saved draft, the app opens on the import screen:

- A large heading and a short explanation of the ChatGPT/AI-assistant workflow.
- A comfortable, focused textarea for structured resume text.
- **Import & Preview** as the primary action.
- **Load example** to fill the fictional sample.
- A collapsible example of the input format.
- Inline validation for empty input, missing name headings, and concatenated resumes.

Nothing is uploaded. Nothing is saved until the import succeeds.

## Returning users

A valid draft opens directly in the editor. The header always offers:

| Action     | Behavior                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| **New**    | Opens the import screen for a new resume; the current draft stays saved until a new import replaces it. |
| **Import** | Opens the import screen; use **Load current draft** to edit the existing content as text.               |
| **Format** | Toggles the formatting panel.                                                                           |
| **PDF**    | Downloads a selectable-text PDF.                                                                        |
| **Word**   | Downloads an editable DOCX.                                                                             |
| **Theme**  | Switches light/dark; far right of the header.                                                           |

New and Import do not discard content. The import screen shows **Back to current resume** whenever a draft exists.

## Import validation

- Empty text → "Paste resume text before importing."
- No top-level `#` heading → asks for a single name line.
- More than one top-level `#` heading → rejects the import so two documents cannot be mixed.
- Valid text replaces the whole document and preserves the current page size and formatting.

## Themes

- Light is the default when the system preference is unavailable or light.
- With no explicit choice, the system `prefers-color-scheme` is used and live changes apply.
- The header toggle stores an explicit `light` or `dark` choice under `openresume-theme`.
- An inline script resolves the theme before styles load, so there is no flash of the wrong theme.
- The resume page and both exports keep fixed colors; only the application shell changes.

## Footer

The footer follows Kovina conventions: a light closing strip with product name, version, Kovina ecosystem attribution, and minimal links (GitHub, input format, MIT license). It uses the same theme tokens and stacks on narrow screens.

## Keyboard and accessibility

- `Ctrl`/`⌘` + `Enter` imports from the import screen.
- `Escape` returns to the current resume when the New/Import screen has a draft to return to.
- Import textarea is focused on entry.
- Header actions are native buttons with `aria-label`, `title`, and focus-visible rings.
- Icons are decorative (`aria-hidden`) and never carry the only accessible name.
- Form fields are labeled; the preview exposes a page count and is readable by assistive technology.

## Responsive behavior

| Width      | Behavior                                                                |
| ---------- | ----------------------------------------------------------------------- |
| ≥ 1041px   | Editor rail and preview side by side                                    |
| 721–1040px | Editor above preview; formatting grid becomes two columns at ≤ 900px    |
| ≤ 720px    | Header becomes two rows: brand + theme, then icon-only document actions |
| ≤ 560px    | Formatting controls stack; footer stacks                                |
| ≤ 480px    | Import screen uses tighter padding                                      |

At every width the resume page scales to fit; text remains selectable and the document is never inverted for dark mode.
