# Deployment

OpenResume is a static, client-only Vite application. Production is hosted on Vercel from the `main` branch.

> **Deployment status:** the production domain currently serves v0.1.2. The v0.1.3 dual-document release is committed locally and is not deployed until explicit approval. The deployment configuration below is unchanged by v0.1.3.

## Production

| Item                  | Value                                      |
| --------------------- | ------------------------------------------ |
| Production URL        | https://openresume-sigma.vercel.app        |
| Vercel project        | `openresume` (team: Sparsh Sam's projects) |
| GitHub repository     | `sparshsam/openresume`                     |
| Production branch     | `main`                                     |
| Preview deployments   | Enabled for pull requests                  |
| Domain                | Vercel default; no custom domain           |
| Environment variables | None                                       |

Pushing to `main` triggers a production deployment. Pull requests get preview deployments; previews are protected by Vercel Authentication, while production is public.

## Build

Vercel uses the repository's existing build:

```bash
npm ci
npm run build   # tsc --noEmit && vite build → dist/
```

`vercel.json` pins `framework: vite`, `installCommand: npm ci`, `buildCommand: npm run build`, and `outputDirectory: dist`. The project runs on Node 24; `package.json` requires Node 22 or newer.

The app reads no environment variables. A clean clone builds and runs without any Vercel environment configuration.

## Headers and caching

`vercel.json` applies:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, and payment
- `Cross-Origin-Opener-Policy: same-origin`
- Content Security Policy allowing same-origin scripts/styles plus the inline theme bootstrap, with `connect-src 'none'`, `object-src 'none'`, and `frame-ancestors 'none'`

Caching:

- `/assets/*` — `public, max-age=31536000, immutable` (Vite content hashes)
- `/` and `/index.html` — `public, max-age=0, must-revalidate`
- favicons and app icons — `public, max-age=86400`

## Local-first guarantees

The deployed app remains fully client-side:

- No server functions, databases, authentication, or analytics.
- No runtime network requests.
- Resume drafts persist in `localStorage['openresume:draft.v1']`.
- Cover letter drafts persist in `localStorage['openresume:cover-letter.v1']`.
- Theme choice persists in `localStorage['openresume-theme']`.
- PDF and DOCX exports are generated in the browser.

## Verification

After a deployment:

1. Load the production URL and confirm the document-selection screen appears with no console errors.
2. Build a resume and a cover letter from the examples, then verify editing and live previews.
3. Use **Copy AI Instructions** and confirm the complete template reaches the clipboard.
4. Create a matching cover letter from a resume and confirm the resume is unchanged.
5. Toggle light/dark, reload, and confirm the theme and both drafts persist.
6. Export PDF and DOCX for both documents and confirm text is selectable/editable.
7. Check the layout at desktop and phone widths.
8. Inspect the network panel: only same-origin document and asset requests.
9. Confirm the security and cache headers with `curl -I`.
10. Confirm GitHub Actions CI is green.

## Rollback

Use the Vercel dashboard for the `openresume` project: open **Deployments**, select the last known-good production deployment, and promote or roll back to it. Application versions and Git tags are unchanged by a rollback.
