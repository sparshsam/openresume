# AI instructions

OpenResume is designed to receive content prepared with an AI assistant. The preparation screens include **Copy AI Instructions**, which copies a complete, paste-ready template for the selected document type.

## Why the output is a code block

The templates require the assistant to return exactly one plain-text code block containing the complete document. Chat interfaces render Markdown headings as formatted text; when a response is copied, the literal `#`, `##`, and `###` markers can be lost. OpenResume's parsers depend on those markers, so a rendered response becomes malformed input.

The code fence solves that problem by making the document plain text:

- The fence is only a delivery container. It is **not** part of the document content.
- The first character inside the block must be `#`, followed by the applicant's full name.
- The assistant must produce no explanatory text outside the block and no additional code blocks.
- The document must contain no tables or HTML.

The templates do not require literal Markdown headings outside the code block.

## Application Kit output

The Application Kit template asks for the same single plain-text code block, but the block contains two documents in a fixed order. Use these exact delimiters on their own lines:

```text
=== OPENRESUME: RESUME ===
# Full Name
...

=== OPENRESUME: COVER LETTER ===
# Full Name
...
```

- The resume comes first and the cover letter second.
- Each delimiter appears exactly once.
- Each document keeps its own `#` name heading and its own parser format.
- Nothing may appear before the resume delimiter or after the cover letter.
- The two sections share one set of applicant facts. The template must not invent a different identity, employer, date, or qualification for either document.

The combined parser validates both sections before any document is replaced. Missing, duplicated, reversed, empty, or prose-wrapped delimiters are rejected with a specific message. If the two documents use different names, emails, phones, or locations, the build still succeeds with a warning and the details are left exactly as written.

**Load Example** on the Application Kit preparation screen inserts the same canonical combined sample that the AI template demonstrates. The template wraps it in one enclosing code fence; the preparation screen inserts the unfenced content, which the combined parser accepts. There is one shared sample in `src/lib/applicationKitSample.ts`, so the instructions and the example cannot drift.

## Identity fields and locations

All three templates include one shared definition block so the assistant cannot confuse the applicant's identity fields. The block distinguishes five roles:

- **Professional headline** — the applicant's short self-description on the contact line under their name. It is never an employer, job title, or location.
- **Target job title** — the role the applicant is applying for. It appears only in the cover letter `POSITION` section (or in letter prose), never in the contact line.
- **Employment job title** — the role held at one employer, written only after the `—` in a `### Employer Name — Job Title` entry heading.
- **Employer name** — the organization where the role was held, written only before the `—` in that heading.
- **Geographic location** — a verified city and region/country (`Toronto, ON`), or an explicitly confirmed arrangement (`Remote`, `Hybrid`, `On-site`, `Online`, `Remote (Canada)`). It appears only in a location slot: the last non-link part of the contact line, or the part after `|` in an entry metadata line.

### Contact-line contract

All three templates use one canonical structure:

```text
Professional Headline | email | phone | Location | Link | Link
```

- Every part after the name is optional. If a value is unavailable, omit the part entirely. Never leave an empty `|` slot and never substitute another value.
- The headline is always the first part when present; the location is always the last part before links.
- A professional headline may equal the employment job title, but the target job title never appears in the contact line.
- Never place a job title, employer, or professional headline in a location slot.

### Location validation

Valid location values are a verified city with a region or country (`Toronto, ON`, `Vancouver, British Columbia`, `Berlin, Germany`) or a confirmed work arrangement (`Remote`, `Hybrid`, `On-site`, `Remote (Canada)`). The templates explicitly mark job titles, headlines, employer names, addresses, and inferred locations as invalid, and instruct the assistant never to infer a location from an employer name, job title, phone country code, time zone, or job description. When no verified location exists, the contact line carries no location part and an entry metadata line carries only its date range (`2022 – Present`).

### Published examples

`AI_CONTACT_LINE_EXAMPLES` in [`src/lib/aiInstructions.ts`](../src/lib/aiInstructions.ts) contains the five real examples copied into every template:

1. Full contact line with headline, email, phone, location, and one link.
2. No headline.
3. No location.
4. No phone and no location, with two links.
5. A confirmed remote arrangement with two links.

`tests/aiInstructions.test.ts` and `tests/aiFieldPlacement.test.ts` parse every example with the real parser, so an example cannot drift from parser behaviour. The same tests feed realistic malformed résumé, cover-letter, and application-kit output and assert that a missing headline or location never moves a job title into the Location field.

The parser side is also defensive: email, phone, and links are recognised by pattern, and a geographic value is accepted only when it validates as a place or confirmed arrangement and does not read as a role. Entry metadata after `|` is validated the same way. A rejected value produces a warning instead of silently landing in the wrong field.

The shared block is the exported `AI_FIELD_DEFINITIONS` constant, and `tests/aiInstructions.test.ts` fails if any template stops including it.

## Workflow

Each preparation screen, and every homepage card, offers **Copy AI Instructions**. The preparation screen shows the same six steps:

1. Copy AI Instructions.
2. Paste them into ChatGPT or another AI assistant.
3. Provide your details and the target job description.
4. Copy the generated structured text.
5. Paste it into OpenResume.
6. Build the document (or both documents, for an Application Kit).

Copy the block contents directly when the interface offers a copy button. If the assistant's response includes the fence, OpenResume accepts it: the preparation parser strips one complete enclosing fence before parsing.

## What the templates contain

Each template explains:

- The role, task, and required output container. The Application Kit template also explains the delimiter contract and the resume-then-letter order.
- The exact input structure and markers.
- Every supported section heading and alias, generated from the parser constants.
- How resume entries or cover letter paragraphs are structured.
- Which fields are optional.
- Formatting rules, including one top-level `#` heading, `##` sections, `###` entries, `- ` bullets, `|` contact separators, and `Label: values` skills.
- Content-quality rules: use only verified information, never invent employers, dates, degrees, certifications, achievements, skills, or metrics, and use concise Canadian English.
- Conflict handling: ask a concise clarification question before generating when supplied records materially conflict.
- A canonical example that the real parser accepts.

## Paste handling

The parsers remove exactly one complete enclosing fence when all of these are true:

- The first non-empty line is an unlabelled fence or a `text`-labelled fence.
- The last non-empty line is a closing fence.
- The interior contains content and no other fence line.

Ambiguous input is left unchanged. A fence surrounded by prose, an unbalanced fence, two separate fence pairs, or a fence containing another fence line is parsed as ordinary text. This keeps the defensive behaviour from rewriting unrelated content.

The Application Kit preparation screen applies the same enclosing-fence rule before it looks for the two delimiters. A malformed fence is rejected with a clear message instead of being guessed at.

The primary workflow still encourages copying the block contents directly; fence stripping is a compatibility measure.

## Single source of truth

The templates live in [`src/lib/aiInstructions.ts`](../src/lib/aiInstructions.ts). They are generated from the same constants the parsers use:

- `RESUME_SECTION_ALIASES` and `RESUME_SECTION_TITLES` in `src/lib/parse.ts`.
- `COVER_LETTER_SECTION_ALIASES` in `src/lib/parseCoverLetter.ts`.
- `RESUME_DELIMITER` and `COVER_LETTER_DELIMITER` in `src/lib/applicationKitFormat.ts`, shared by the kit template and the combined parser.

The UI copies these strings directly. There is no separate hand-maintained copy in documentation, so the instructions and parsers cannot silently drift.

## Drift protection

`tests/aiInstructions.test.ts` fails when:

- A resume or cover letter parser alias is missing from the matching instructions.
- A template loses a required structural or factual rule.
- A template stops requiring exactly one plain-text code block.
- The bundled instruction example no longer parses with the real parser.

When adding a section alias or changing the input format:

1. Update the parser constant.
2. Update the parser tests.
3. Run `npm test` and confirm the AI instruction drift tests pass.

## Copy behavior

- Success shows “AI instructions copied. Paste them into your AI assistant.”
- Clipboard failure shows a clear error without losing the textarea content.
- Copying uses the Clipboard API only; it makes no network request.
- **Load Example** is separate: it fills the fictional example into the textarea and does not copy instructions.

## Guided workflow prompt

`buildGuidedPrompt(job, output)` in [`src/lib/guidedPrompt.ts`](../src/lib/guidedPrompt.ts) creates the job-specific prompt used by `/prepare`. It adds a required-input contract before the shared definitions:

- The applicant's existing résumé must be uploaded or pasted.
- The complete job description must be read from the supplied `jd_url`. If the assistant cannot access it, the prompt requires it to ask for pasted text or screenshots.
- The listing summary supplied by Job Directory is explicitly marked as a brief preview, not a substitute for the full description.
- The assistant must never invent applicant facts; it must ask a clarifying question when something essential is missing.
- The output contract is the existing `getAiInstructions('resume')` or `getAiInstructions('applicationKit')`, so the guided output remains parser-compatible.
- The shared `AI_FIELD_DEFINITIONS` block keeps the professional headline, target job title, employment job title, employer, and location separate.

`tests/guidedPrompt.test.ts` checks the required-input safeguards, the job-description URL, the listing-summary warning, and both output contracts.
