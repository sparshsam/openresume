# OpenResume v0.2.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v0.2.1: eight genuinely redesigned résumé compositions, a compact Format workspace drawer, and a parser/AI-contract fix that keeps job titles and headlines out of the Location field.

**Architecture:** The design registry gains structural traits (page arrangement, header variant, heading decoration, entry layout, sidebar treatment) that the existing pure `Layout` pipeline resolves into absolute-positioned blocks, rules, bands, and backgrounds. Preview, PDF, and DOCX keep consuming one `Layout`. The contact parser moves from positional guessing to pattern classification plus geographic validation. The formatting UI becomes a left-docked, non-modal drawer with Design and Formatting tabs.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 5, jsPDF, docx, CSS.

**Spec:** User request in the 2026-11-08 session (v0.2.1 scope). No separate spec file.

## Global Constraints

- Preserve Professional Two-Column and ATS Simple exactly.
- Preserve the three workflows: Résumé, Cover Letter, Application Kit.
- No runtime network calls, no telemetry, no new persistence. Browser-only, deterministic.
- One `Layout` feeds preview, PDF, and DOCX.
- PDF text selectable; DOCX text editable; no rasterized pages.
- All tests, `npm run check`, and `npm run format:check` must pass.
- Version `0.2.1` everywhere version is declared.
- Do not push until the implementation and checks are complete.
- `main` is protected by a ruleset requiring a PR, a passing `check` status, up-to-date branch, and resolved conversations.

## Review Focus

- A contact line with an omitted headline followed by a job title: the job title must become the headline, never the location.
- An entry metadata line whose second part is a job title: the value must be rejected as a location, with a warning.
- A résumé using a theme accent that is light: banner/fill text must remain legible.
- A long résumé in any new design: no clipped blocks, blank pages, or lost content.
- Switching between a one-column and a sidebar design: stored section columns must be untouched.

---

### Task 1: Contact classification and defensive location validation

**Files:**

- Modify: `src/lib/contact.ts`
- Test: `tests/contact.test.ts`

**Interfaces:**

- Produces: `parseContactLine(line: string): ParsedContactLine` where `ParsedContactLine` gains `warnings: string[]`; `looksLikeJobTitle(value: string): boolean`; `looksLikeLocation(value: string): boolean`; `isConfirmedWorkArrangement(value: string): boolean`.

- [ ] **Step 1: Write failing tests**

Add cases: missing headline with a trailing job title; job title in the final slot; missing location; multiple links in any order; remote and hybrid arrangements; a professional headline that starts with "Remote"; legitimate `City, Province`, `City, Country`, and multiword-city locations; and a warning when a title-like value occupies the location slot.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/contact.test.ts`
Expected: FAIL on location/title assertions.

- [ ] **Step 3: Implement pattern classification**

Split on `|`. Assign email, phone, and links by pattern regardless of order. Classify the remaining free text into location parts (`looksLikeLocation` and not `looksLikeJobTitle`) and headline parts (everything else). Join location parts with `·` and headline parts with `·`. Emit a warning when a title-like final value was withheld from the location slot. Add a curated set of regions, countries, and multiword cities; do not infer locations from phone codes or employer names.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/contact.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contact.ts tests/contact.test.ts
git commit -m "fix: classify contact fields by pattern and reject job titles as locations"
```

### Task 2: Propagate warnings and validate entry metadata

**Files:**

- Modify: `src/lib/parse.ts`, `src/lib/parseCoverLetter.ts`
- Test: `tests/parse.test.ts`, `tests/parseCoverLetter.test.ts`, `tests/parseApplicationKit.test.ts`

**Interfaces:**

- Consumes: `parseContactLine`, `looksLikeJobTitle` from Task 1.
- Produces: contact warnings appear in `ParseResult.warnings` and `CoverLetterParseResult.warnings`.

- [ ] **Step 1: Write failing tests**

Résumé: `2022 – Present | Senior Product Engineer` must leave `location` empty and add a warning. Cover letter: same contact-line malformations as Task 1. Application kit: both documents keep location empty and produce the warnings.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parse.test.ts tests/parseCoverLetter.test.ts tests/parseApplicationKit.test.ts`

- [ ] **Step 3: Implement warning propagation and metadata validation**

Push contact warnings into the document warnings. In the entry-metadata branch, reject a candidate location that `looksLikeJobTitle` and warn; keep the date range.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/parse.test.ts tests/parseCoverLetter.test.ts tests/parseApplicationKit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse.ts src/lib/parseCoverLetter.ts tests/parse.test.ts tests/parseCoverLetter.test.ts tests/parseApplicationKit.test.ts
git commit -m "fix: reject job titles in entry location slots and surface parser warnings"
```

### Task 3: Rewrite the shared AI contact contract and add realistic examples

**Files:**

- Modify: `src/lib/aiInstructions.ts`
- Test: `tests/aiInstructions.test.ts`, new `tests/aiFieldPlacement.test.ts`

**Interfaces:**

- Produces: `AI_CONTACT_LINE_EXAMPLES: string[]` exported from `aiInstructions.ts`; `AI_FIELD_DEFINITIONS` includes the canonical five-slot contract and the examples.

- [ ] **Step 1: Write failing tests**

Assert the contract names all five field roles (professional headline, target job title, employment job title, employer, geographic location), states that an absent field is omitted entirely, forbids titles in location slots, and that every example line parses with the expected placement. Add full malformed résumé, cover-letter, and kit fixtures.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/aiInstructions.test.ts tests/aiFieldPlacement.test.ts`

- [ ] **Step 3: Rewrite `AI_FIELD_DEFINITIONS` and the three templates**

Use one canonical contact line in all three: `Professional Headline | email | phone | Location | Link | Link`. Add "omit the part, never an empty slot", target-title vs employment-title vs employer definitions, valid/invalid location examples, missing-headline, missing-location, missing-phone, and multiple-link examples. Keep every existing parser alias mention and the one-code-block delivery rules.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/aiInstructions.test.ts tests/aiFieldPlacement.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/aiInstructions.ts tests/aiInstructions.test.ts tests/aiFieldPlacement.test.ts
git commit -m "feat: make the AI contact contract explicit and regression-test field placement"
```

### Task 4: Extend the design architecture and layout primitives

**Files:**

- Modify: `src/lib/designs.ts`, `src/lib/metrics.ts`, `src/lib/paginate.ts`, `src/lib/layout.ts`
- Test: `tests/designs.test.ts`, `tests/layout.test.ts`, `tests/paginate.test.ts`

**Interfaces:**

- Produces: `ResumeArrangement`, `HeaderVariant`, `HeadingDecor`, `ItemLayout`; `ResumeDesign` traits `arrangement`, `header.variant`, `heading.decor`, `item`, `sidebar`; `FlowLine.yOffsetPt`, `FlowBlock.heightOverridePt`, `FlowBlock.indentLeftPt`, `FlowBlock.headingDecor`, `FlowBlock.rowLayout`; `PlacedRule` as a rectangle; `PlacedBlock.rules`, `PlacedBlock.band`, `PlacedBlock.rowLayout`; `PageLayout.backgrounds`, `PageLayout.divider`; `HeaderLayout.band`.

- [ ] **Step 1: Write failing tests**

Test that all ten designs have unique structural signatures, that `twoColumn` and `atsSimple` keep their original trait values, that a `titleRow` places title and meta on the same baseline, that a gutter entry indents body blocks, and that a fill heading emits a band plus white text.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/designs.test.ts tests/layout.test.ts tests/paginate.test.ts`

- [ ] **Step 3: Implement the traits and primitives**

Add the new types and defaults. Keep `columns` derived from arrangement for exporter compatibility. Implement header variants (`stacked`, `centered`, `split`, `banner`, `compact`), heading decoration (`none`, `underline`, `trailing`, `bar`, `fill`, `topRule`, `boxed`), item layouts (`stacked`, `titleRow`, `gutter`), and sidebar geometry/tint/divider.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/designs.test.ts tests/layout.test.ts tests/paginate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/designs.ts src/lib/metrics.ts src/lib/paginate.ts src/lib/layout.ts tests/designs.test.ts tests/layout.test.ts tests/paginate.test.ts
git commit -m "feat: add structural design traits for headers, headings, entries, and sidebars"
```

### Task 5: Author the eight new compositions

**Files:**

- Modify: `src/lib/designs.ts`, `src/components/DesignThumbnail.tsx`
- Test: `tests/designs.test.ts`, `tests/templateSwitch.test.ts`

**Interfaces:**

- Consumes: Task 4 traits.

- [ ] **Step 1: Write failing tests**

Assert the eight redesigns each pair a distinct arrangement/header/heading/entry combination, keep a clear use-case description, and that no two designs share a full structural signature.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/designs.test.ts tests/templateSwitch.test.ts`

- [ ] **Step 3: Define the compositions**

- Executive: linear, centered serif masthead, underlined headings, right-aligned dates.
- Modern Minimal: linear, split identity, trailing heading rules, right-aligned dates, airy spacing.
- Classic: linear, centered serif identity with double rule, framed section headings, right-aligned dates.
- Creative: left tinted rail, oversized stacked identity, accent-bar headings, stacked entries.
- Compact: balanced two-column, inline identity, narrow rail, accent-bar headings, dense right-aligned dates.
- Academic: linear with a dated left margin, split identity, fine underlined headings, serif.
- Contemporary: right tinted rail, accent banner header, top-rule headings, right-aligned dates.
- Bold: linear, solid accent banner, filled section bands with reversed text, right-aligned dates.

Rewrite `ResumeThumbnail` to draw the actual header variant, arrangement, sidebar tint, heading decoration, and entry layout.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/designs.test.ts tests/templateSwitch.test.ts`
Expected: PASS, including content preservation under all ten designs.

- [ ] **Step 5: Commit**

```bash
git add src/lib/designs.ts src/components/DesignThumbnail.tsx tests/designs.test.ts tests/templateSwitch.test.ts
git commit -m "feat: redesign eight resume templates with distinct compositions"
```

### Task 6: Render new primitives in preview, PDF, and DOCX

**Files:**

- Modify: `src/components/PageView.tsx`, `src/lib/exportPdf.ts`, `src/lib/exportDocx.ts`
- Test: `tests/exportPdf.test.ts`, `tests/exportDocx.test.ts`, `tests/exportAts.test.ts`, `tests/templateSwitch.test.ts`

**Interfaces:**

- Consumes: Tasks 4–5.

- [ ] **Step 1: Write failing tests**

Test that banner headers, rule rectangles, heading bands, sidebar tint/divider, title rows, and gutter indents appear in the layout and survive PDF and DOCX export; that ATS Simple still emits no tables; and that two-column designs emit one table per page.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/exportPdf.test.ts tests/exportDocx.test.ts tests/exportAts.test.ts tests/templateSwitch.test.ts`

- [ ] **Step 3: Implement rendering**

Preview: background rects, header band/rules, block bands/rules, divider, y-offset lines, indentation. PDF: filled rectangles for bands/backgrounds, rectangle rules, y-offset lines. DOCX: header tab-stop variants and banner shading; paragraph shading/borders for heading decoration; title-row tab stops; paragraph indentation; sidebar cell shading and cell order; keep one body table per page.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/exportPdf.test.ts tests/exportDocx.test.ts tests/exportAts.test.ts tests/templateSwitch.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PageView.tsx src/lib/exportPdf.ts src/lib/exportDocx.ts tests/exportPdf.test.ts tests/exportDocx.test.ts tests/exportAts.test.ts tests/templateSwitch.test.ts
git commit -m "feat: render structural design primitives across preview, PDF, and DOCX"
```

### Task 7: Replace the formatting section with a compact drawer

**Files:**

- Modify: `src/components/FormattingPanel.tsx`, `src/components/DesignGallery.tsx`, `src/components/Header.tsx`, `src/components/Icon.tsx`, `src/App.tsx`, `src/styles/globals.css`, `src/styles/tokens.css`
- Test: `tests/App.test.tsx`, new `tests/formattingDrawer.test.tsx`

**Interfaces:**

- `FormattingPanel` gains `onClose: () => void`; returns a non-modal drawer with tabs `Designs` and `Formatting`, `role="dialog"`, `aria-labelledby`, Escape close, focus restore.
- `Header` Format button gains `aria-expanded` (already present) and an `aria-label` of `Close formatting` while open.

- [ ] **Step 1: Write failing tests**

Test that Format opens a dialog without pushing the workspace down; that the Designs tab shows ten compact thumbnails in a responsive grid; that switching design keeps the preview visible and updates it; that the Formatting tab exposes all existing controls; that Escape and the close button close the drawer; that cover letters show letter styles and no résumé design group; and that focus returns to the Format button.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/App.test.tsx tests/formattingDrawer.test.tsx`

- [ ] **Step 3: Implement the drawer**

Left-docked fixed panel on desktop (`width: min(420px, 100vw)`), full-screen sheet with backdrop under 760px. Sticky header with title and close; tablist; scrollable body; sticky footer with Reset. Compact thumbnail grid (`repeat(auto-fill, minmax(104px, 1fr))`) with proportional SVG thumbs and selected badge. Grouped formatting controls. Preserve accent radiogroup name and all field labels. Add `x` icon.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/App.test.tsx tests/formattingDrawer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/FormattingPanel.tsx src/components/DesignGallery.tsx src/components/Header.tsx src/components/Icon.tsx src/App.tsx src/styles/globals.css src/styles/tokens.css tests/App.test.tsx tests/formattingDrawer.test.tsx
git commit -m "feat: move formatting into a compact workspace drawer"
```

### Task 8: Documentation, version bump, verification, release

**Files:**

- Modify: `package.json`, `package-lock.json`, `src/lib/appMeta.ts`, `CHANGELOG.md`, `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/formatting.md`, `docs/interface.md`, `docs/input-format.md`, `docs/ai-instructions.md`, `docs/architecture.md`, `docs/deployment.md`
- Test: full suite.

- [ ] **Step 1: Update version and docs**

Set `0.2.1` in `package.json`, `package-lock.json`, and the `appMeta` fallback. Add the changelog entry. Update design descriptions, the drawer documentation, the contact-line contract, and deployment status.

- [ ] **Step 2: Run the full check**

Run: `npm run check && npm run format:check`
Expected: lint, typecheck, all tests, and build pass; formatting clean.

- [ ] **Step 3: Commit and push a branch**

```bash
git add -A
git commit -m "chore(release): v0.2.1"
git push -u origin feat/v0.2.1
```

- [ ] **Step 4: Open, verify, and merge the PR**

Use `gh` with `GITHUB_TOKEN` unset. Wait for the `check` status. Merge with the repository's allowed method.

- [ ] **Step 5: Tag and publish the pre-release**

```bash
git tag -a v0.2.1 -m "OpenResume v0.2.1"
git push origin v0.2.1
gh release create v0.2.1 --prerelease --title "OpenResume v0.2.1" --notes-file <notes>
```

- [ ] **Step 6: Verify production**

Confirm the Vercel production deployment for `main` is READY and `https://resume.kovina.org` serves bundle content containing `0.2.1` and the new drawer/design strings.
