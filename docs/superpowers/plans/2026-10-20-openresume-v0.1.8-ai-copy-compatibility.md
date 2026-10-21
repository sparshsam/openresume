# OpenResume v0.1.8 — AI Instruction Copy Compatibility

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AI-generated resume and cover letter output reliably copyable into OpenResume by requiring one plain-text code block, generating both templates from parser-supported headings, and defensively stripping a single enclosing fence on paste.

**Architecture:** Keep the existing parsers as the source of truth. Add one pure helper, `stripEnclosingCodeFence`, that removes exactly one complete enclosing fence pair before parsing. Rewrite both instruction strings around the same parser constants. Add workflow guidance to the preparation screen; no backend, no network, no persistence, no document-design changes.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Prettier, ESLint.

**Spec:** The v0.1.8 task brief supplied by Sparsh on 2026-10-20 (Phases 1–10).

## Global Constraints

- Exactly one top-level `#` heading; `##` sections; `###` entries; `- ` bullets; `|` contact separators; `Label: values` skills.
- One `Layout` per document; never re-paginate in an exporter.
- No network, backend, auth, analytics, cloud storage, or integrated AI.
- Documents stay in memory; only `openresume-theme` may persist.
- No runtime dependency additions.
- Parser-supported headings only; generate alias lists from parser constants.
- Version `0.1.8`; annotated tag `v0.1.8`; GitHub pre-release.
- Land through a PR to protected `main`; no direct push, force-push, or deletion.
- No document design, accent, branding, or information-page changes.

## Review Focus

- Pasted text with prose before or after a fence: must not be silently rewritten; only a clean enclosing pair is stripped.
- A fence with an interior ``` line: must not be stripped (prevents eating legitimate content).
- Unbalanced or non-enclosing fences: unchanged input and existing validation messages.
- Fenced and unfenced copies of the same document: identical parsed models (no content drift).
- Copied instruction text: exactly one fenced example, complete aliases, and no prose-outside-the-block ambiguity.

---

### Task 1: Enclosing-fence normalizer

**Files:**

- Create: `src/lib/codeFence.ts`
- Test: `tests/codeFence.test.ts`

**Interfaces:**

- Produces: `stripEnclosingCodeFence(input: string): string`

- [ ] **Step 1: Write failing tests**

Cover: ` ```text ` and unlabelled fences stripped; interior preserved byte-for-byte; prose before/after the fence prevents stripping; unbalanced fence unchanged; two fence pairs unchanged; interior ``` line unchanged; CRLF input normalized to `\n` inside a stripped block; non-fence input returned unchanged (same string).

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run tests/codeFence.test.ts`
Expected: FAIL — module cannot be resolved.

- [ ] **Step 3: Implement**

Match the first and last non-empty lines; opening must be `^```(?:text)?$` after trim; closing `^```$`; require at least one non-empty interior line and no other line starting with ``` between them. Return the interior lines joined with `\n`; otherwise return the original input unchanged.

- [ ] **Step 4: Run tests and verify pass**

Run: `npx vitest run tests/codeFence.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/codeFence.ts tests/codeFence.test.ts
git commit -m "feat: add enclosing code-fence normalizer"
```

---

### Task 2: Wire normalizer into both parsers

**Files:**

- Modify: `src/lib/parse.ts` (start of `parseResume`)
- Modify: `src/lib/parseCoverLetter.ts` (start of `parseCoverLetter`)
- Test: `tests/parse.test.ts`, `tests/parseCoverLetter.test.ts`

**Interfaces:**

- Consumes: `stripEnclosingCodeFence` from Task 1.

- [ ] **Step 1: Write failing tests**

Add one test per parser: fenced input parses to a model deep-equal to the unfenced input's model, `documentCount` is 1, and warnings are unchanged. Add a malformed test per parser: prose surrounding a fence leaves the model equal to parsing the raw text (i.e., no stripping).

- [ ] **Step 2: Run tests and verify failure**

Run: `npx vitest run tests/parse.test.ts tests/parseCoverLetter.test.ts`
Expected: the new fenced-model equality tests FAIL (junk section/warning differences) while existing tests pass.

- [ ] **Step 3: Implement**

Normalize once at the top of each parser: `const normalized = stripEnclosingCodeFence(input);` and use `normalized` for line splitting and the empty-input warning. Do not add warnings for a stripped fence.

- [ ] **Step 4: Run tests and verify pass plus full suite**

Run: `npx vitest run tests/parse.test.ts tests/parseCoverLetter.test.ts` then `npm test`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse.ts src/lib/parseCoverLetter.ts tests/parse.test.ts tests/parseCoverLetter.test.ts
git commit -m "feat: accept one enclosing code fence when parsing"
```

---

### Task 3: Resume AI instructions

**Files:**

- Modify: `src/lib/aiInstructions.ts`
- Test: `tests/aiInstructions.test.ts`

- [ ] **Step 1: Write failing tests**

Assert: `RESUME_AI_INSTRUCTIONS` contains “Return exactly ONE plain-text code block”; states the fence is only a delivery container; requires literal `#`, `##`, `###` markers; requires the first character inside the block to be `#`; contains exactly two ``` fence lines; still mentions every alias; `RESUME_AI_EXAMPLE` parses with the real parser; no explanatory prose outside the block is permitted; the complete string is returned by `getAiInstructions('resume')`.

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run tests/aiInstructions.test.ts`
Expected: FAIL on the code-block assertions (current template forbids fences).

- [ ] **Step 3: Implement**

Rewrite `RESUME_AI_EXAMPLE` as one fenced plain-text block beginning `# Jordan Avery`. Rewrite `RESUME_AI_INSTRUCTIONS` with ROLE, TASK, OUTPUT, structure, optional sections, IMPORTANT, FORMATTING RULES, CONTENT QUALITY, and CONFLICT HANDLING sections. Interpolate `${RESUME_SECTION_LIST}` and `${RESUME_LIST_SECTIONS}`. Keep all parser-supported headings, including AWARDS and INTERESTS.

- [ ] **Step 4: Run and verify pass**

Run: `npx vitest run tests/aiInstructions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/aiInstructions.ts tests/aiInstructions.test.ts
git commit -m "feat: require a plain-text code block in resume instructions"
```

---

### Task 4: Cover letter AI instructions

**Files:**

- Modify: `src/lib/aiInstructions.ts`
- Test: `tests/aiInstructions.test.ts`

- [ ] **Step 1: Write failing tests**

Same code-block assertions for `COVER_LETTER_AI_INSTRUCTIONS`; confirm the example begins with `# ` inside the block; confirm every cover letter alias is mentioned; confirm the example parses and has at least one body paragraph.

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run tests/aiInstructions.test.ts`
Expected: FAIL on the new cover letter assertions.

- [ ] **Step 3: Implement**

Fence `COVER_LETTER_AI_EXAMPLE`. Rewrite the instructions with ROLE, TASK, OUTPUT, exact parser sections, conflict handling, and Canadian-English/tailoring quality rules. Use `${COVER_LETTER_SECTION_LIST}`.

- [ ] **Step 4: Run and verify pass**

Run: `npx vitest run tests/aiInstructions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/aiInstructions.ts tests/aiInstructions.test.ts
git commit -m "feat: require a plain-text code block in cover letter instructions"
```

---

### Task 5: Preparation-screen workflow and copy feedback

**Files:**

- Modify: `src/components/PrepareScreen.tsx`
- Modify: `src/styles/globals.css`
- Test: `tests/App.test.tsx`

- [ ] **Step 1: Write failing tests**

Assert the preparation screen renders the six-step workflow as an ordered list, the copy success toast is `AI instructions copied. Paste them into your AI assistant.`, the copied value equals the instruction constant, and copying performs no `fetch` call.

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run tests/App.test.tsx`
Expected: FAIL on the workflow list and toast text.

- [ ] **Step 3: Implement**

Add a compact `<ol className="prepare-steps">` for the six steps, update the toast string, and add minimal muted styles matching `.prepare-help`. Keep the existing buttons and keyboard behavior unchanged.

- [ ] **Step 4: Run and verify pass**

Run: `npx vitest run tests/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PrepareScreen.tsx src/styles/globals.css tests/App.test.tsx
git commit -m "feat: explain the AI copy-paste workflow on preparation screens"
```

---

### Task 6: Documentation and version 0.1.8

**Files:**

- Modify: `CHANGELOG.md`, `README.md`, `docs/ai-instructions.md`, `docs/input-format.md`, `docs/interface.md`, `docs/deployment.md`, `CLAUDE.md`, `AGENTS.md`, `src/lib/appMeta.ts`, `package.json`, `package-lock.json`

- [ ] **Step 1: Bump the version without creating a tag**

Run: `npm version 0.1.8 --no-git-tag-version`
Update the `appMeta.ts` fallback to `0.1.8`.

- [ ] **Step 2: Update docs**

Explain the one-code-block requirement and why (rendered headings lose literal markers). Document the six-step workflow. Document accepted fences (`text` and unlabelled, exactly one complete pair) and the non-stripping cases. Update the state sections in `CLAUDE.md`/`AGENTS.md`, including the new `src/lib/codeFence.ts` module and the fenced-input invariant.

- [ ] **Step 3: Verify formatting and docs**

Run: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: document AI copy workflow and release 0.1.8"
```

---

### Task 7: PR and merge

- [ ] Create branch `fix/ai-instructions-copy-compatibility`.
- [ ] Push branch and open a PR into `main` with the repository template.
- [ ] Wait for the `check` workflow; confirm success and branch up to date.
- [ ] Review `git diff main...HEAD` for unintended changes.
- [ ] Merge without bypassing branch protection; confirm `main` contains the merge commit.

---

### Task 8: Release and production verification

- [ ] Create annotated tag `v0.1.8` on the merge commit and push it.
- [ ] Create GitHub pre-release `v0.1.8` with generated notes.
- [ ] Confirm the Vercel production deployment is built from the merge commit and READY.
- [ ] Confirm `https://resume.kovina.org` serves bundle version `0.1.8` and both hostnames respond.
- [ ] Verify the preparation screens, Copy AI Instructions, fenced and raw parsing, and PDF/DOCX export paths.
- [ ] Confirm only same-origin requests and no document persistence.

## Self-Review

- Spec coverage: Phases 2–8 map to Tasks 3–6; Phase 6 to Tasks 1–2; Phase 9–10 to Tasks 7–8.
- Type consistency: one helper name, `stripEnclosingCodeFence`, used by both parsers.
- Review Focus entries each have a test in Task 1 or Task 2.
- No new dependencies; no design or export changes.
