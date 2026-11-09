# Job Directory integration contract

OpenResume exposes a guided application workflow at **`https://resume.kovina.org/prepare`**. Job Directory can hand a client into that workflow with public job information in the query string. The contract is versioned through `contract` and is backward compatible: unknown parameters are ignored, and a missing `contract` means version 1.

The route also works when opened directly with no query string. In that case the guided workflow asks for the job details in the browser before it continues.

## Route

```text
https://resume.kovina.org/prepare?contract=1&job_id=...&job_title=...&employer=...
  &location=...&jd_url=...&apply_url=...&details=...&qualifications=...
```

Every parameter is optional. Provide URL-encoded values. The workflow validates the context and drops invalid fields with a visible warning; it never crashes or trusts raw values.

## Parameters (version 1)

| Parameter        | Limit | Meaning                                                                                          |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------ |
| `contract`       | 4     | Contract version. Omit or send `1`. Unknown versions warn and read the version 1 fields.         |
| `job_id`         | 200   | Directory or employer job identifier. Shown to the AI assistant for reference.                   |
| `job_title`      | 200   | The target job title. Used in the prompt and guided download filenames.                          |
| `employer`       | 200   | Employer name.                                                                                   |
| `location`       | 200   | Job location, as listed.                                                                         |
| `jd_url`         | 2048  | The **job-description** URL. The prompt asks the AI assistant to read this page.                 |
| `apply_url`      | 2048  | The **employer application** URL. Used only on the final “Apply” step.                           |
| `details`        | 4000  | A brief listing summary. The prompt explicitly labels it as a preview, not the full description. |
| `qualifications` | 4000  | A brief qualifications summary. Same caveat as `details`.                                        |

Limits are character counts after decoding. Short fields are collapsed to a single line. Text fields keep paragraphs and are capped. A URL longer than 2048 characters is dropped.

## URL validation

- Only `https:` URLs are accepted for `jd_url` and `apply_url`.
- URLs with a username or password are rejected.
- `javascript:`, `data:`, `file:`, `blob:`, and plain `http:` values are rejected.
- A rejected URL is omitted from the workflow and produces a warning in the job card.
- `jd_url` and `apply_url` are separate fields and are never substituted for each other. If `apply_url` is missing, the completion screen says the application link was not provided instead of pretending the job-description page is the application page.

## Privacy

- The query string carries **public job information only**. Never put an applicant's résumé, name, email, phone number, generated document, or any other personal detail in the URL.
- OpenResume does not fetch either URL. It does not call the Job Directory, the employer, or an AI provider.
- Job context, applicant content, and generated documents stay in the browser for the current session. The guided workflow adds no accounts, analytics, backend, or persistence.
- The page is marked `noindex, follow` so job-specific query URLs are not indexed.

## Missing or incomplete context

| Situation                         | Behavior                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| No query string                   | Step 1 opens a job-details form. All fields are optional.                                  |
| Missing title, employer, location | Shows “Not provided” and continues. The prompt asks the assistant for what it needs.       |
| Missing `jd_url`                  | Shows a warning. The prompt asks the assistant to request pasted text or screenshots.      |
| Missing `apply_url`               | Step 5 explains that no employer link was provided and asks the client to return to it.    |
| Invalid URL                       | Drops that URL with a warning; other context still works.                                  |
| Unsupported `contract`            | Warns and reads the version 1 fields.                                                      |
| Oversized value                   | Short/text values are shortened with a warning; oversized URLs are dropped with a warning. |

## Example

```ts
const parameters = new URLSearchParams({
  contract: '1',
  job_id: 'brightline-42',
  job_title: 'Senior Product Engineer',
  employer: 'Brightline Labs',
  location: 'Toronto, ON',
  jd_url: 'https://jobs.example.com/description/42',
  apply_url: 'https://jobs.example.com/apply/42',
  details: 'Build calm document tools for a small product team.',
  qualifications: 'Five years of product engineering and TypeScript.',
});

const url = `https://resume.kovina.org/prepare?${parameters.toString()}`;
```

A resolved example:

```text
https://resume.kovina.org/prepare?contract=1&job_id=brightline-42&job_title=Senior+Product+Engineer&employer=Brightline+Labs&location=Toronto%2C+ON&jd_url=https%3A%2F%2Fjobs.example.com%2Fdescription%2F42&apply_url=https%3A%2F%2Fjobs.example.com%2Fapply%2F42&details=Build+calm+document+tools.&qualifications=Five+years+of+product+engineering.
```

## TypeScript shape

```ts
interface JobContext {
  version: 1;
  id?: string;
  title?: string;
  employer?: string;
  location?: string;
  jobDescriptionUrl?: string;
  applicationUrl?: string;
  details?: string;
  qualifications?: string;
}
```

The implementation is `src/lib/jobContext.ts`; `parseJobContext(window.location.search)` returns `{ job, warnings, hasContext }`.

## Forward compatibility

- New optional parameters may be added without changing `contract`; version 1 readers ignore unknown keys.
- Change `contract` only for a breaking change to an existing parameter's meaning.
- Job Directory should always URL-encode values and keep them within the limits above.
- The link should open in a new tab or window when Job Directory wants to keep its own page available.

## What the guided workflow does

1. **Choose an AI assistant** — ChatGPT, Claude, or Gemini opens in a new tab; the client confirms.
2. **Prepare tailored content** — copies a job-specific prompt that requires the base résumé and the complete job description, with the `jd_url` included.
3. **Build documents** — parses the assistant's structured output with the existing OpenResume parser and shows recoverable errors.
4. **Review and download** — reuses the existing editor, preview, templates, and formatting; downloads use `ApplicantName_JobTitle_Resume.pdf` / `_Cover_Letter.docx`.
5. **Apply** — opens `apply_url` in a new tab after the documents are ready. OpenResume never submits an application.
