# OpenResume v0.3.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a separate `/prepare` guided job-application workflow with a versioned Job Directory URL contract, a job-specific AI tailoring prompt, and full reuse of the existing parser, editor, preview, template, and export engines.

**Architecture:** `/prepare` is a second Vite HTML entry that renders a `GuidedWorkflow` instead of the default builder. `GuidedWorkflow` owns guided state (job context, assistant, output type, pasted text, documents) and composes existing components (`Header`, `EditorPanel`, `CoverLetterEditor`, `Preview`, `FormattingPanel`, `Footer`) and pure edit/layout/export functions. Job context is validated in `src/lib/jobContext.ts`; the prompt is built in `src/lib/guidedPrompt.ts` from the existing AI instruction architecture; guided filenames live in `src/lib/filename.ts`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 5, jsPDF, docx.

**Spec:** User request in the 2026-11-08 v0.3.0 session.

## Global Constraints

- Existing `/`, `/about`, `/privacy`, `/terms`, all three workflows, templates, formatting, and export naming are unchanged.
- `/prepare` works with no Job Directory context.
- No backend, accounts, AI APIs, analytics, external processing, or new dependencies.
- Applicant résumés, personal details, and generated documents never go through URLs.
- Only `https:` URLs are accepted for job-description and application links.
- Guided filenames: `ApplicantName_JobTitle_Resume.pdf` and `ApplicantName_JobTitle_Cover_Letter.docx`, sanitized.
- `npm run check` and `npm run format:check` must pass.
- `main` is protected: PR, passing `check`, up-to-date branch, resolved conversations.

## Review Focus

- A URL with `contract=2`, missing fields, or unsafe schemes must not crash or inject markup.
- The prompt must refuse to proceed without both the base résumé and the full job description.
- A malformed assistant response must preserve the pasted text and offer a route back to the assistant.
- Guided exports must use guided filenames while the default builder keeps existing filenames.
- The default builder must remain fully functional after the route split.

---

### Task 1: Job context contract

**Files:** `src/lib/jobContext.ts`, `tests/jobContext.test.ts`.

- Parse `contract`, `job_id`, `job_title`, `employer`, `location`, `jd_url`, `apply_url`, `details`, `qualifications`.
- Validate https URLs, limits, control characters, version compatibility.
- Return `{ job, warnings, hasContext }`.

### Task 2: Guided filename and shared download

**Files:** `src/lib/filename.ts`, `src/lib/download.ts`, `src/App.tsx`, tests.

- `guidedFilename(name, jobTitle, kind, extension)` with `Applicant`/`Position` fallbacks.
- Move `downloadBlob` to a shared lib; keep default export names unchanged.

### Task 3: Guided AI prompt

**Files:** `src/lib/guidedPrompt.ts`, `tests/guidedPrompt.test.ts`.

- Compose job context + required-input safeguards + `AI_FIELD_DEFINITIONS` + `getAiInstructions(output)`.
- Require the base résumé and full JD; ask for paste/screenshots when the URL fails; never treat the listing summary as the JD.

### Task 4: `/prepare` route shell

**Files:** `prepare.html`, `vite.config.ts`, `vercel.json`, `src/lib/publicPages.ts`, `tests/publicPages.test.ts`.

- New Vite entry, clean URL, metadata, noindex for job-specific URLs, direct-route support.

### Task 5: Guided steps 1–3

**Files:** `src/components/guided/*`, `tests/guidedWorkflow.test.tsx`.

- Assistant choice and confirmation; job details fallback form.
- Prompt copy and output choice; recoverable parse errors.

### Task 6: Guided review and apply

**Files:** `src/components/guided/GuidedReview.tsx`, `GuidedApply.tsx`, CSS, tests.

- Reuse editors, preview, formatting, templates.
- Guided PDF/Word/both downloads using guided filenames.
- Completion screen with employer application link; no submission claim.

### Task 7: Documentation, version, release

- `docs/job-directory-integration.md`, interface/architecture/README/CHANGELOG/deployment.
- Version 0.3.0, full checks, PR, merge, tag, prerelease, Vercel verification.
