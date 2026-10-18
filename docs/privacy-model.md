# Privacy model

OpenResume is designed so that a resume or cover letter never has to leave the browser.

## Guarantees

- **No network at runtime.** The application makes no `fetch`, XHR, WebSocket, or third-party script requests. There is no backend.
- **No accounts.** There is no authentication, session, or user record.
- **No telemetry.** No analytics, error reporting, or usage measurement is included.
- **No document storage.** Resume and cover letter content lives in memory for the current application session only.
- **No AI.** Content is parsed deterministically; no model sees it.
- **No secrets.** The app requires no environment variables or API keys.

## What is stored

| Location                           | Data              | Purpose                     |
| ---------------------------------- | ----------------- | --------------------------- |
| `localStorage['openresume-theme']` | `light` or `dark` | Restore the interface theme |

Nothing else is persisted. Documents are lost on reload, navigation away, or closing the page. There are no document cookies, IndexedDB databases, caches, or service workers.

Earlier releases stored documents under `openresume:draft.v1` and `openresume:cover-letter.v1`. On startup, OpenResume checks those two keys and removes them only when their contents validate as OpenResume documents. Other values in local storage are left untouched and are never read as documents.

## Hosting

The application is served as static files by Vercel. Vercel and other infrastructure providers may process ordinary technical information such as IP addresses and HTTP request metadata to deliver and secure the site. OpenResume does not add analytics, advertising, tracking cookies, or document-content collection.

The public policy is at https://resume.kovina.org/privacy. Questions can be sent to **sparshsam@gmail.com**, the verified public Kovina contact.

## What leaves the browser

Only what you explicitly export:

- A PDF file generated locally by jsPDF.
- A DOCX file generated locally by the `docx` package.

Both are created in memory and downloaded. They are not uploaded anywhere.

## Deleting data

- Clear site data for the app's origin in the browser settings; this removes the theme preference.
- Reloading or closing the page discards the current documents permanently; there is no backup.
- Legacy draft entries are removed automatically when identified as valid OpenResume documents.

## Threat model

The relevant risks are local, not remote:

- Another person with access to the browser profile can read the stored theme preference, but no document content is stored.
- Malicious text pasted into the editor is rendered as text, never as HTML.
- Third-party dependency compromise is the main supply-chain risk; dependencies are intentionally minimal and pinned by the lockfile.

## Verification

The privacy claims are checkable:

```bash
grep -RInE "fetch\\(|XMLHttpRequest|WebSocket|sendBeacon|navigator\\.sendBeacon" src/
grep -RInE "localStorage|sessionStorage|indexedDB" src/
```

Expected: no network calls; storage references limited to the theme module and the one-time legacy cleanup.
