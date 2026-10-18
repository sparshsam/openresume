# Deployment

OpenResume is a static, client-only Vite application. Production is hosted on Vercel from the `main` branch.

> **Deployment status:** production serves v0.1.5 at https://resume.kovina.org. The original Vercel deployment remains available at https://openresume-sigma.vercel.app.

## Production

| Item                  | Value                                          |
| --------------------- | ---------------------------------------------- |
| Production URL        | https://resume.kovina.org                      |
| Vercel deployment URL | https://openresume-sigma.vercel.app            |
| Vercel project        | `openresume` (team: Sparsh Sam's projects)     |
| GitHub repository     | `sparshsam/openresume`                         |
| Production branch     | `main`                                         |
| Preview deployments   | Enabled for pull requests                      |
| Domain                | Custom `resume.kovina.org` plus Vercel default |
| Environment variables | None                                           |

Pushing to `main` triggers a production deployment. Pull requests get preview deployments; previews are protected by Vercel Authentication, while production is public. Both production hostnames serve the same deployment; no redirect is configured between them.

## Custom domain

`resume.kovina.org` is attached to the `openresume` Vercel project as a production domain. The `kovina.org` zone is managed in Cloudflare; Vercel owns the project domain and certificate.

| Item                 | Value                                      |
| -------------------- | ------------------------------------------ |
| DNS record           | `CNAME`                                    |
| DNS name             | `resume` (`resume.kovina.org`)             |
| DNS target           | `f813a105c6923adb.vercel-dns-017.com.`     |
| Cloudflare proxy     | DNS only                                   |
| TTL                  | Auto                                       |
| Vercel configuration | `CNAME` recognized; `misconfigured: false` |
| Certificate          | Let's Encrypt, CN `resume.kovina.org`      |
| Domain verification  | Verified in Vercel                         |

The target is a project-specific Vercel DNS target. Do not replace it with the generic `cname.vercel-dns.com` unless the project-specific target stops being returned by Vercel.

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
- Resume and cover letter content lives in memory for the current session only.
- No document content is written to `localStorage`, `sessionStorage`, or IndexedDB.
- Theme choice persists in `localStorage['openresume-theme']`.
- PDF and DOCX exports are generated in the browser.

## Verification

After a deployment:

1. Load https://resume.kovina.org and https://openresume-sigma.vercel.app; both must serve the same version with no console errors.
2. Confirm the custom-domain certificate and HTTPS response with `curl -I` and `openssl s_client`.
3. Build a resume and a cover letter from the examples, then verify editing and live previews.
4. Use **Copy AI Instructions** and confirm the complete template reaches the clipboard.
5. Create a matching cover letter from a resume and confirm the resume is unchanged.
6. Toggle light/dark and reload: the theme persists, while both documents are cleared.
7. Export PDF and DOCX for both documents and confirm text is selectable/editable.
8. Check the layout at desktop and phone widths.
9. Inspect the network panel: only same-origin document and asset requests.
10. Confirm the security and cache headers with `curl -I`.
11. Confirm GitHub Actions CI is green.

## Rollback

Use the Vercel dashboard for the `openresume` project: open **Deployments**, select the last known-good production deployment, and promote or roll back to it. Application versions and Git tags are unchanged by a rollback.
