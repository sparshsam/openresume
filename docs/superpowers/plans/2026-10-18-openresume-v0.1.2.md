# OpenResume v0.1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make importing the obvious starting point, add a clear icon-led header, light/dark/system theming, a standards-compliant footer, and visual polish without changing the document engine or resume template.

**Architecture:** Add a two-view shell (`import` / `editor`) above the existing editor and preview. `useDraft` stops fabricating a sample and returns `Resume | null`, so first launch lands on the import view. A `ThemeProvider` follows OpenPalette's `data-theme` + `<app>-theme` localStorage convention, with an inline pre-hydration script to prevent FOUC. The resume document and both exports keep their fixed colors and layout.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, inline SVG icons (no new dependency), CSS custom properties.

**Spec:** This document plus the user's v0.1.2 brief (import-first experience, header redesign, dark mode, footer, visual refinement, workflow, QA, release).

## Global Constraints

- Preserve the architecture, resume template, document engine, formatting controls, and exports.
- No AI APIs, auth, backend, cloud storage, analytics, or new resume templates.
- No new runtime dependencies. Icons are inline SVG.
- Theme persistence key: `openresume-theme`; values `light` / `dark`; system preference is the default when unset.
- Resume document and PDF/DOCX colors must not change with UI theme.
- Ecosystem-standards govern; Kovina conventions apply where compatible.
- Version `0.1.2`; no push or deploy.
- `npm run check` and `npm run format:check` must pass.

## File structure

```
src/
├── components/
│   ├── Header.tsx            (replaces Toolbar.tsx)
│   ├── Footer.tsx            (new)
│   ├── ImportScreen.tsx      (new; replaces ImportDialog.tsx)
│   ├── ThemeProvider.tsx     (new)
│   ├── ThemeToggle.tsx       (new)
│   ├── Icon.tsx              (new; inline SVGs)
│   ├── FormattingPanel.tsx   (restyled)
│   ├── EditorPanel.tsx       (minor)
│   ├── SectionEditor.tsx     (minor)
│   ├── Preview.tsx           (minor)
│   └── PageView.tsx          (unchanged document colors)
├── hooks/useDraft.ts         (Resume | null)
├── lib/appMeta.ts            (APP_VERSION)
├── styles/{tokens.css,globals.css,preview.css}
├── App.tsx                   (view state + wiring)
├── main.tsx                  (ThemeProvider)
└── vite-env.d.ts             (__APP_VERSION__)
```

## Task 1: Import-first shell

**Files:** `src/hooks/useDraft.ts`, `src/components/ImportScreen.tsx`, `src/App.tsx`, `tests/App.test.tsx`.

**Produces:**

- `useDraft(): { resume: Resume | null; setResume; saveState }`
- `ImportScreen({ mode: 'new' | 'import'; currentText?: string; onImport; onBack? })`
- App view state `'import' | 'editor'`.

- [ ] Test: no draft → import heading, empty textarea, “Import & Preview”, “Load example”.
- [ ] Test: empty input shows an error; two headings show the guard error.
- [ ] Test: valid import → editor with content and a saved draft.
- [ ] Test: seeded draft → editor directly; New → import screen; Back restores content.
- [ ] Test: repeated import replaces; concatenated input never applies.
- [ ] Implement `Resume | null`, the import view, import screen, and safe New/Import navigation.
- [ ] Keep the current template when importing/replacing.

## Task 2: Header and icon system

**Files:** `src/components/Header.tsx`, `src/components/Icon.tsx`, `src/App.tsx`, `src/components/Toolbar.tsx` (delete), `tests/App.test.tsx`.

- [ ] Actions: New, Import, Format, PDF, Word; grouped New/Import | Format | PDF/Word | Theme.
- [ ] Inline SVG icons from `Icon.tsx`; no dependency.
- [ ] `aria-label`, `title`, focus-visible, disabled states when no resume.
- [ ] Labels hide below 960px; icons remain accessible.
- [ ] Test keyboard reachability and action wiring.

## Task 3: Theme system

**Files:** `src/components/ThemeProvider.tsx`, `src/components/ThemeToggle.tsx`, `src/main.tsx`, `index.html`, `src/styles/tokens.css`, `src/styles/globals.css`, `tests/setup.ts`, `tests/App.test.tsx`.

- [ ] `data-theme` on `<html>`; key `openresume-theme`; system default; live system changes only while unset.
- [ ] Inline head script sets the resolved theme before CSS loads (no FOUC).
- [ ] OpenPalette token names: `--bg-base`, `--bg-surface`, `--bg-surface-muted`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-default`, `--accent`, `--accent-hover`, `--accent-contrast`, `--error`.
- [ ] Light/dark palettes with accessible contrast; `color-scheme` set.
- [ ] Toggle at the far right of the header.
- [ ] Test: default light, stored dark, system dark, toggle persists, resume line colors unchanged.

## Task 4: Footer

**Files:** `src/components/Footer.tsx`, `src/lib/appMeta.ts`, `vite.config.ts`, `src/vite-env.d.ts`, `src/App.tsx`, tests.

- [ ] Slim footer: brand + version + Kovina attribution; links to GitHub, input format, MIT license, Kovina.
- [ ] Version injected from `package.json` via `__APP_VERSION__`.
- [ ] Responsive, token-themed, `role="contentinfo"`.
- [ ] Test version/link presence.

## Task 5: Visual refinement

**Files:** `src/styles/tokens.css`, `src/styles/globals.css`, `src/styles/preview.css`, component class names.

- [ ] Spacing scale, radii 8/12/16, balanced button sizes, consistent icon sizes.
- [ ] Import screen: editorial column, large heading, comfortable textarea, clear primary action.
- [ ] Cleaner section cards; better editor/preview separation; calmer borders.
- [ ] Header blur + sticky; responsive wrapping; footer stacking.
- [ ] Focus rings, hover states, reduced-motion support.
- [ ] Document preview keeps fixed white page and document colors.
- [ ] Manual browser check at 375, 768, 1280, and 1920 widths in both themes.

## Task 6: QA and release

**Files:** `package.json`, `CHANGELOG.md`, `README.md`, `ARCHITECTURE.md`, `docs/interface.md`, `CLAUDE.md`, `AGENTS.md`.

- [ ] Tests: first launch, returning user, valid/invalid import, replace, New, theme switch/persistence/system, keyboard, footer, formatting regression, PDF/DOCX regression.
- [ ] Run `npm run format`, `npm run format:check`, `npm run check`.
- [ ] Manual: import → edit → format → export in light and dark; all page sizes.
- [ ] Bump to `0.1.2`, update docs/changelog, refresh screenshots.
- [ ] Commit locally; no push or deployment.
