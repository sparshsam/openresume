# OpenResume

A privacy-first, local-first resume builder that turns structured text into professionally formatted PDF and DOCX resumes.

## Status

**Early development — v0.1.0.** Built for a single-user, fast-repetition workflow first; the architecture leaves room for broader public use later.

## Description

OpenResume exists because resume updates should not require an account, a subscription, or a web service that keeps a copy of your career history. You paste structured text — the kind ChatGPT or a notes app already produces — and OpenResume deterministically parses it into a fixed, two-column document with reliable pagination.

Everything runs in the browser. There is no backend, authentication, analytics, cloud storage, or integrated AI. Drafts are stored in `localStorage`; exports are generated locally. The app never makes a network request at runtime.

The initial release optimizes for repeated production: parse once, edit inline, export a selectable-text PDF and an editable DOCX without re-flowing the layout by hand.

![OpenResume editor and live preview](assets/hero/hero-light.png)

## Features

- **Structured text input** with predefined and custom sections.
- **Deterministic parsing** — no model calls, no guessing, no content rewriting.
- **Fixed two-column template** with configurable section ordering and column assignment.
- **Live, page-aware preview** rendered from the same layout coordinates as the exports.
- **Reliable pagination** that splits at line boundaries and never drops content.
- **Selectable-text PDF** generated with real text, not screenshots.
- **Editable DOCX** with a two-column table per logical page.
- **Local draft persistence** with a versioned storage key.
- **Accessible editor** with labeled controls, keyboard focus, and reduced-motion support.
- **No backend, auth, analytics, cloud storage, or AI.**

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the pipeline, module boundaries, invariants, and pagination model.

The short version:

```
structured text → parser → Resume model → layout engine → pages
                                                     ├── live preview
                                                     ├── PDF (jsPDF)
                                                     └── DOCX (docx)
```

## Getting started

```bash
git clone https://github.com/sparshsam/openresume
cd openresume
npm ci
npm run dev
```

Open the printed local URL. The app loads the fictional sample resume on first run.

### Commands

| Command                | Purpose                            |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite development server  |
| `npm run build`        | Typecheck and produce `dist/`      |
| `npm run preview`      | Serve the production build locally |
| `npm run lint`         | ESLint                             |
| `npm run format:check` | Prettier check                     |
| `npm run typecheck`    | TypeScript, no emit                |
| `npm test`             | Vitest suite                       |
| `npm run check`        | Lint, typecheck, test, and build   |

Helper scripts live in `scripts/` (`build.sh`, `test.sh`, `lint.sh`, `generate-icons.py`), each with `--help`.

## Input format

The canonical format and edge cases are documented in [docs/input-format.md](docs/input-format.md). A minimal example:

```text
# Jordan Avery
Product-minded software generalist | jordan@example.com | +1 555 0142 | Toronto, ON

## SUMMARY
One or two sentences of positioning.

## EXPERIENCE
### Northwind Studio — Senior Product Engineer
2022 – Present | Toronto, ON
- Shipped a thing that mattered, with a number attached.
```

Parsing is deterministic: markers define structure, and content is preserved exactly except for structural whitespace.

## Limitations

- One fixed template and page size (A4) in v0.1.0.
- Helvetica-family metrics only; custom font embedding is not supported.
- DOCX mirrors the PDF page model. Editing text in Word can re-flow individual pages.
- No import from PDF or existing DOCX; input is structured text only.
- No cloud sync or backup. Clearing browser storage deletes the draft.
- Desktop-first. Editing works on smaller screens but is not the primary workflow.
- The app icon is an intentional placeholder and will be replaced.

## Privacy model

No network requests, no telemetry, no accounts. Drafts live under `openresume:draft.v1` in the browser's `localStorage`. See [docs/privacy-model.md](docs/privacy-model.md).

## Ecosystem role

OpenResume is part of the [Kovina](https://kovina.org) ecosystem of owned, local-first tools. It follows the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards) and the [Kovina standards](https://github.com/sparshsam/kovina/tree/main/standards) where they do not conflict.

## License

[MIT](LICENSE).

---

_This repository follows the [ecosystem standards](https://github.com/sparshsam/ecosystem-standards)._
