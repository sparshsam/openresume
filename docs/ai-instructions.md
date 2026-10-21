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

## Workflow

Each preparation screen shows the same six steps:

1. Copy AI Instructions.
2. Paste them into ChatGPT or another AI assistant.
3. Provide your details and the target job description.
4. Copy the generated structured text.
5. Paste it into OpenResume.
6. Build the document.

Copy the block contents directly when the interface offers a copy button. If the assistant's response includes the fence, OpenResume accepts it: the preparation parser strips one complete enclosing fence before parsing.

## What the templates contain

Each template explains:

- The role, task, and required output container.
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

The primary workflow still encourages copying the block contents directly; fence stripping is a compatibility measure.

## Single source of truth

The templates live in [`src/lib/aiInstructions.ts`](../src/lib/aiInstructions.ts). They are generated from the same constants the parsers use:

- `RESUME_SECTION_ALIASES` and `RESUME_SECTION_TITLES` in `src/lib/parse.ts`.
- `COVER_LETTER_SECTION_ALIASES` in `src/lib/parseCoverLetter.ts`.

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
