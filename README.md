# OpenResume

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/app-icon/dark/icon-192.png">
    <img src="assets/app-icon/light/icon-192.png" width="80" height="80" alt="OpenResume app icon">
  </picture>
</p>

A privacy-first, local-first resume and cover letter builder that turns structured text into precise PDF and DOCX documents.

## Status

**Early development — v0.1.12.** Built for a single-user, fast-repetition workflow first; the architecture leaves room for broader public use later.

**Live:** https://resume.kovina.org (production, v0.1.12). The original Vercel deployment remains available at https://openresume-sigma.vercel.app.

## Description

OpenResume exists because document updates should not require an account, a subscription, or a web service that keeps a copy of your career history. You paste structured text — the kind ChatGPT or an AI assistant already produces — and OpenResume deterministically parses it into a precise resume or cover letter.

Resumes offer two layouts: **Professional Two-Column** (the default) and **ATS Simple**, a single-column template with linear reading order and no tables or positioned columns. Cover letters use a calm single-column business-letter layout. Everything supports live preview, formatting, reliable pagination, selectable-text PDF export, and editable DOCX export.

ATS Simple reduces common parsing obstacles; no layout can guarantee compatibility with a specific applicant tracking system.

Everything runs in the browser. There is no backend, authentication, analytics, cloud storage, or integrated AI. Resume, cover letter, and Application Kit content live in memory for the current session only; exports are generated locally. The app never makes a network request at runtime.

The workflow is:

```
Choose document → Prepare content → Build → Edit/Preview → Export
```

OpenResume opens on a document-selection screen with three cards: **Resume**, **Cover Letter**, and **Application Kit**. Each card starts a new build in its preparation screen and offers **Copy AI Instructions**. A document created in the current session can be reopened from its card with **Open resume**, **Open cover letter**, or **Open application kit**.

The **Application Kit** builds a tailored resume and matching cover letter together from one combined AI response. Both documents open in a tabbed workspace, remain independently editable, and can be exported as one combined PDF, one combined Word document, or separate files.

![OpenResume document selection](assets/hero/hero-light.png)

Documents are session-only. Reloading or closing the page may discard them; nothing is written to `localStorage` except the interface theme. A new build replaces the previous document of the same type without a confirmation dialog.

## Public pages

- [About](https://resume.kovina.org/about) — why OpenResume exists and how the workflow fits together.
- [Privacy Policy](https://resume.kovina.org/privacy) — the actual local processing, session storage, and hosting model.
- [Terms of Use](https://resume.kovina.org/terms) — free use, document ownership, and the MIT license.

These pages share the application header, footer, themes, and responsive layout. Moving between them does not reload the application or discard session documents.

## Features

- **Three-card document-selection landing page** for a resume, a cover letter, or an Application Kit, with Build, Copy AI Instructions, and session-only Open actions.
- **Preparation screens** with a large paste area, Copy AI Instructions, Load Example, the six-step AI workflow, and inline validation.
- **Application Kit workflow** that builds both documents atomically, warns about cross-document inconsistencies, and preserves the previous documents if validation fails.
- **Tabbed kit workspace** with accessible Resume and Cover Letter tabs, independent editing and formatting, and no duplicated document data.
- **Deterministic parsing** — no model calls, no guessing, no content rewriting.
- **Resume workspace** with two layouts — **Professional Two-Column** (default) and **ATS Simple** (single column) — preserving section ordering, editing, formatting, and pagination. Switching layouts keeps every word and both documents in a kit stay independent.
- **Configurable Application Kit order** — **Cover Letter → Resume** (default) or **Resume → Cover Letter** — applied to both combined exports.
- **Cover letter workspace** with applicant details, date, recipient, position, salutation, body paragraphs, closing, and signature.
- **Create matching cover letter** from a resume, reusing applicant identity and contact details without changing the resume.
- **AI instruction templates** for both document types, generated from the parsers' supported headings and covered by drift tests.
- **Session-based documents** for resumes and cover letters; navigating within the app preserves both, while reloads start clean.
- **US Letter, A4, and US Legal** page sizes, switchable before export.
- **Document-specific formatting controls** for margins, font size, line spacing, section spacing, content density, and the controls relevant to each document type.
- **Accent colour** selection from nine professional presets, applied consistently to the preview, PDF, and DOCX.
- **Live, page-aware preview** rendered from the same layout coordinates as the exports.
- **Reliable pagination** that keeps headings and signatures with content and avoids blank pages.
- **Selectable-text PDF** generated with real text, not screenshots.
- **Editable DOCX** with readable, naturally flowing paragraphs.
- **Combined exports** for the kit in either document order, with an explicit page break and Word sections when the two documents use different page sizes or margins.
- **Separate kit downloads** for each document as PDF or Word.
- **Light, dark, and system themes** with a persistent, flash-free header toggle.
- **Accessible editors** with labeled controls, keyboard focus, and reduced-motion support.
- **Consistent branding** with one visible header mark and favicon across both themes, plus light and dark app icons and social preview assets generated from the authoritative logo masters.
- **No backend, auth, analytics, cloud storage, or AI.**

## Cover letters

The cover letter workspace uses a single-column business-letter layout:

- Applicant name, optional headline, and contact information.
- Date, recipient details, position or subject, and salutation.
- Multiple editable body paragraphs.
- Closing and signature.
- The same page sizes, margins, font sizing, line spacing, section spacing, paragraph spacing, and content density as the resume.
- Selectable-text PDF and editable DOCX exports.

The resume template is unchanged. Formatting is stored with each document, so the two documents can use different settings.

![OpenResume cover letter workspace](assets/screenshots/light/cover-letter.png)

## AI instructions

Every preparation screen and every homepage card includes **Copy AI Instructions**. The copied template explains the exact structured format, supported headings and aliases, entry/paragraph rules, optional fields, and the factual-accuracy requirement.

The resume and cover letter templates ask the assistant to return exactly one plain-text code block containing the complete document. The code fence is only a delivery container: the first character inside it must be `#`, and the literal `#`, `##`, and `###` markers must survive. This matters because chat interfaces render Markdown headings; copying a rendered response can silently drop the markers OpenResume needs.

The Application Kit template asks for one code block containing both documents, in this order:

```text
=== OPENRESUME: RESUME ===
# Full Name
...

=== OPENRESUME: COVER LETTER ===
# Full Name
...
```

Each section uses the same format as its standalone document. OpenResume validates both sections together and replaces neither document if either one fails.

The workflow is:

1. Copy AI Instructions.
2. Paste them into ChatGPT, Claude, or another assistant.
3. Provide your details and the target job description.
4. Copy the generated structured text.
5. Paste it into OpenResume.
6. Build the document.

OpenResume accepts the code block as copied. It also strips one complete enclosing fence — a fence labelled `text` or an unlabelled fence — before parsing; a fence surrounded by prose or an ambiguous fence is left untouched. See [docs/ai-instructions.md](docs/ai-instructions.md).

The templates live beside the parsers in `src/lib/aiInstructions.ts` and are generated from the parsers' supported headings. Tests fail if an alias exists in a parser but not in the instructions, or if either template stops requiring one code block.

## Themes

The header toggle switches between light and dark. With no stored choice, OpenResume follows the operating system preference and updates live when it changes. The choice persists under `openresume-theme`.

The interface shell changes theme; **the resume and cover letter documents and their PDF/DOCX colors do not**. The preview page always keeps its professional white page and fixed typography colors.

![OpenResume in dark mode](assets/screenshots/dark/cover-letter.png)

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the pipeline, module boundaries, invariants, and pagination model.

The short version:

```
structured text → parser → document model → layout engine → pages
                                                          ├── live preview
                                                          ├── PDF (jsPDF)
                                                          └── DOCX (docx)
```

Resume and cover letter models share contact parsing, metrics, pagination, preview components, and export primitives while keeping separate templates and layouts.

## Deployment

**Production:** https://resume.kovina.org

The original Vercel deployment address is retained at https://openresume-sigma.vercel.app.

Vercel builds the standard Vite output (`npm run build` → `dist`) from `main` with no environment variables. Pull requests receive preview deployments, and the production domain is public. HTTP requests are redirected to HTTPS automatically by Vercel with a `308`. `cleanUrls` exposes the static About, Privacy, and Terms pages at their extensionless URLs. See [docs/deployment.md](docs/deployment.md) for configuration, headers, caching, and verification.

## Branding

The application icon is generated from the authoritative light and dark PNG masters in [`assets/branding/source-assets`](assets/branding/source-assets/). The reproducible pipeline and complete asset inventory are documented in [docs/branding.md](docs/branding.md).

## Getting started

```bash
git clone https://github.com/sparshsam/openresume
cd openresume
npm ci
npm run dev
```

Open the printed local URL. The app opens on the document-selection screen. Choose a document, then use **Load Example** on the preparation screen to start with a fictional sample.

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

### Keyboard

- `Ctrl`/`⌘` + `Enter` builds from the preparation screen.
- `Escape` returns to the previous workspace or the landing page.
- All header actions are native buttons with focus-visible rings and accessible labels.

## Input format

The canonical formats and edge cases for both documents are documented in [docs/input-format.md](docs/input-format.md).

A minimal resume example:

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

A minimal cover letter example:

```text
# Jordan Avery
Product-minded software generalist | jordan@example.com | Toronto, ON

## DATE
October 18, 2026

## RECIPIENT
Morgan Lee
Hiring Manager
Brightline Labs

## POSITION
Senior Product Engineer

## SALUTATION
Dear Ms. Lee,

## BODY
First paragraph.

Second paragraph.

## CLOSING
Sincerely,

## SIGNATURE
Jordan Avery
```

Parsing is deterministic: markers define structure, and content is preserved exactly except for structural whitespace. One complete enclosing code fence around the whole document is accepted and removed before parsing, so an AI response can be pasted as-is. Prepare one document at a time; text containing more than one top-level `#` heading is rejected so documents cannot be mixed.

An Application Kit uses the same rules inside two delimited sections. The delimiters must each appear exactly once, in resume-then-cover-letter order. Missing, duplicated, reversed, empty, or prose-wrapped sections are rejected with a clear message. Cross-document name or contact differences are reported as warnings and are never rewritten.

## Page sizes and formatting

The default is **US Letter (8.5 × 11 in)**. The **Formatting** panel also offers A4 (210 × 297 mm) and US Legal (8.5 × 14 in), plus:

| Control           | Options                                                       | Shown for              |
| ----------------- | ------------------------------------------------------------- | ---------------------- |
| Resume layout     | Professional Two-Column, ATS Simple                           | Resume                 |
| Page margins      | Narrow, Normal, Wide                                          | Both                   |
| Font size         | Small, Standard, Large                                        | Both                   |
| Line spacing      | Compact, Standard, Relaxed                                    | Both                   |
| Section spacing   | Compact, Standard, Relaxed                                    | Both                   |
| Paragraph spacing | Compact, Standard, Relaxed                                    | Cover letter           |
| Bullet spacing    | Compact, Standard, Relaxed                                    | Resume                 |
| Column spacing    | Narrow, Standard, Wide                                        | Two-column resume only |
| Content density   | Compact, Balanced, Spacious                                   | Both                   |
| Accent Colour     | Green, Blue, Navy, Teal, Purple, Red, Orange, Brown, Charcoal | Both                   |

Choose from a selection of professional accent colours for your resume or cover letter. The accent applies to document headings, the name, and the header rule in the live preview, PDF, and DOCX. Each document keeps its own accent for the session; **Reset to defaults** restores Green.

Formatting applies to the preview, PDF, and DOCX, and stays with each document for the current session. **Reset to defaults** restores US Letter with the standard presets. See [docs/formatting.md](docs/formatting.md).

## Limitations

- Two resume layouts (Professional Two-Column and ATS Simple) and one fixed single-column letter template; page sizes and spacing are configurable. ATS Simple is not a guarantee of compatibility with any particular applicant tracking system.
- Helvetica-family metrics only; custom font embedding is not supported.
- DOCX flows text naturally inside each logical page. Editing in Word can re-flow individual pages; pagination is structurally consistent with the PDF rather than pixel-identical.
- No import from PDF or existing DOCX; input is structured text only.
- Cover letters are not generated. **Create matching cover letter** reuses identity and contact details and scaffolds the section markers; you write the body.
- No cloud sync, backup, or reload recovery. Reloading or closing the page discards the current documents.
- Desktop-first. Editing works on smaller screens but is not the primary workflow.

## Privacy model

No network requests, no telemetry, no accounts. Resume and cover letter content stays in memory for the current session and is never written to `localStorage`. Only the interface theme preference is stored, under `openresume-theme`. See the public [Privacy Policy](https://resume.kovina.org/privacy) and [docs/privacy-model.md](docs/privacy-model.md).

## Ecosystem role

OpenResume is part of the [Kovina](https://kovina.org) ecosystem of owned, local-first tools. It follows shared Kovina ecosystem standards and the public [Kovina standards](https://github.com/sparshsam/kovina/tree/main/standards) where they do not conflict.

## License

[MIT](LICENSE).

<br>

---

<br>

<p align="center">
  <strong>Part of the Kovina Collection</strong>
</p>

<p align="center">
  <a href="https://github.com/sparshsam/openreader">OpenReader</a> ·
  <a href="https://github.com/sparshsam/openjournal">OpenJournal</a> ·
  <a href="https://github.com/sparshsam/openledger">OpenLedger</a> ·
  <a href="https://github.com/sparshsam/opentone">OpenTone</a> ·
  <a href="https://github.com/sparshsam/openpalette">OpenPalette</a> ·
  <a href="https://github.com/sparshsam/openconvert">OpenConvert</a>
</p>

<p align="center">
  <a href="https://github.com/sparshsam/opensnap">OpenSnap</a> ·
  <a href="https://github.com/sparshsam/worldclock-widget">WorldClock Widget</a> ·
  <a href="https://github.com/sparshsam/openproof">OpenProof</a> ·
  <a href="https://github.com/sparshsam/opensend">OpenSend</a> ·
  <a href="https://github.com/sparshsam/opensprout">OpenSprout</a>
</p>

<p align="center">
  <a href="https://github.com/sparshsam/wordwise">WordWise</a> ·
  <a href="https://github.com/sparshsam/openscrabble">OpenScrabble</a> ·
  <a href="https://github.com/sparshsam/chess-by-sparsh">Chess by Sparsh</a> ·
  <a href="https://github.com/sparshsam/hisstastic">Hisstastic</a>
</p>

<p align="center">
  <sub>Minimal, focused tools for everyday tasks.</sub>
</p>

---

_This repository follows the shared Kovina ecosystem standards._
