# Privacy model

OpenResume is designed so that a resume or cover letter never has to leave the browser.

## Guarantees

- **No network at runtime.** The application makes no `fetch`, XHR, WebSocket, or third-party script requests. There is no backend.
- **No accounts.** There is no authentication, session, or user record.
- **No telemetry.** No analytics, error reporting, or usage measurement is included.
- **No cloud storage.** Drafts are stored in the browser only.
- **No AI.** Content is parsed deterministically; no model sees it.
- **No secrets.** The app requires no environment variables or API keys.

## What is stored

| Location                                     | Data                            | Purpose                      |
| -------------------------------------------- | ------------------------------- | ---------------------------- |
| `localStorage['openresume:draft.v1']`        | The complete `Resume` JSON      | Restore the resume on reload |
| `localStorage['openresume:cover-letter.v1']` | The complete `CoverLetter` JSON | Restore the letter on reload |
| `localStorage['openresume-theme']`           | `light` or `dark`               | Restore the interface theme  |

Nothing else is persisted. There are no cookies, IndexedDB databases, caches, or service workers.

## What leaves the browser

Only what you explicitly export:

- A PDF file generated locally by jsPDF.
- A DOCX file generated locally by the `docx` package.

Both are created in memory and downloaded. They are not uploaded anywhere.

## Deleting data

- Clear site data for the app's origin in the browser settings.
- Uninstalling or clearing browser storage removes both drafts and the theme permanently; there is no backup.
- Replacing a document through **New** → build overwrites only that document, after confirmation.

## Threat model

The relevant risks are local, not remote:

- Another person with access to the browser profile can read `localStorage`.
- Malicious text pasted into the editor is rendered as text, never as HTML.
- Third-party dependency compromise is the main supply-chain risk; dependencies are intentionally minimal and pinned by the lockfile.

## Verification

The privacy claims are checkable:

```bash
grep -RInE "fetch\\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\\.sendBeacon" src/
grep -RIn "localStorage\\|sessionStorage\\|indexedDB" src/
```

Expected: no network calls; storage references limited to the draft module and its tests.
