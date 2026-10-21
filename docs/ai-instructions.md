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
