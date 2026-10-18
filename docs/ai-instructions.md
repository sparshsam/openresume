# AI instructions

OpenResume is designed to receive content prepared with an AI assistant. The preparation screens include **Copy AI Instructions**, which copies a complete, paste-ready template for the selected document type.

## What the templates contain

Each template explains:

- The exact input structure and markers.
- Every supported section heading and alias.
- How resume entries or cover letter paragraphs are structured.
- Which fields are optional.
- The factual-accuracy requirement: use only the details the person provides and never invent employers, dates, degrees, certifications, achievements, relationships, or qualifications.
- The output-only rule: return compatible structured text with no code fences, commentary, or questions.
- A canonical example that the real parser accepts.

## Single source of truth

The templates live in [`src/lib/aiInstructions.ts`](../src/lib/aiInstructions.ts). They are generated from the same constants the parsers use:

- `RESUME_SECTION_ALIASES` and `RESUME_SECTION_TITLES` in `src/lib/parse.ts`.
- `COVER_LETTER_SECTION_ALIASES` in `src/lib/parseCoverLetter.ts`.

The UI copies these strings directly. There is no separate hand-maintained copy in documentation, so the instructions and parsers cannot silently drift.

## Drift protection

`tests/aiInstructions.test.ts` fails when:

- A resume or cover letter parser alias is missing from the matching instructions.
- A template loses a required structural or factual rule.
- The bundled instruction example no longer parses with the real parser.

When adding a section alias or changing the input format:

1. Update the parser constant.
2. Update the parser tests.
3. Run `npm test` and confirm the AI instruction drift tests pass.

## Copy behavior

- Success shows “AI instructions copied. Paste them into your AI assistant.”
- Clipboard failure shows a clear error without losing the textarea content.
- **Load Example** is separate: it fills the fictional example into the textarea and does not copy instructions.
