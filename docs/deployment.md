# Deployment

OpenResume is a static, client-only Vite application. Production is hosted on Vercel from the `main` branch.

> **Deployment status:** production serves v0.1.7 at https://resume.kovina.org. The original Vercel deployment remains available at https://openresume-sigma.vercel.app.

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

Changes land through a pull request; merging to `main` triggers a production deployment. Pull requests get preview deployments; previews are protected by Vercel Authentication, while production is public. Both production hostnames serve the same deployment; no redirect is configured between them.

`main` is protected by the active `main-protection` ruleset: no direct pushes, force-pushes, or deletion; a PR with conversation resolution and the `check` status is required, with branches up to date. Required approvals are 0 for solo maintenance, and there are no bypass actors.

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
| HTTP → HTTPS         | Automatic Vercel `308`, no configuration   |

The target is a project-specific Vercel DNS target. Do not replace it with the generic `cname.vercel-dns.com` unless the project-specific target stops being returned by Vercel.

## Public pages and routing

The About, Privacy Policy, and Terms pages are separate Vite HTML entries:

- `about.html` → `/about`
- `privacy.html` → `/privacy`
- `terms.html` → `/terms`

`vercel.json` sets `cleanUrls: true`, so Vercel serves the extensionless URLs and direct requests to each path load the matching static document. Each shell carries its own title, description, canonical URL, Open Graph tags, Twitter card, favicon declarations, and the pre-hydration theme script.

The React application reads `window.location.pathname` and renders the matching page. Footer links and the in-page **Back to builder** link use `history.pushState` instead of a full navigation, so in-memory resumes and cover letters survive while moving between the builder and the information pages. Browser Back and Forward are handled through `popstate`. There is no routing dependency.

`public/robots.txt` and `public/sitemap.xml` list only `/`, `/about`, `/privacy`, and `/terms`, all on `https://resume.kovina.org`. Canonical URLs consistently point at the custom domain rather than the Vercel deployment address. The original `openresume-sigma.vercel.app` host also sends `X-Robots-Tag: noindex` so it does not compete with the custom domain in search results.

## Build

Vercel uses the repository's existing build:

```bash
npm ci
npm run build   # tsc --noEmit && vite build → dist/
```

`vercel.json` pins `framework: vite`, `cleanUrls: true`, `installCommand: npm ci`, `buildCommand: npm run build`, and `outputDirectory: dist`. The project runs on Node 24; `package.json` requires Node 22 or newer.

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
- `/about`, `/privacy`, `/terms` — `public, max-age=0, must-revalidate`
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
2. Confirm the custom-domain certificate and HTTPS response with `curl -I` and `openssl s_client`, and confirm `http://resume.kovina.org` returns a `308` to `https://resume.kovina.org` without a loop.
3. Load `/about`, `/privacy`, and `/terms` directly and refresh each page; confirm the header, footer, metadata, and theme render correctly.
4. Navigate from a workspace to each information page and back; confirm both in-memory documents survive.
5. Build a resume and a cover letter from the examples, then verify editing and live previews.
6. Use **Copy AI Instructions** and confirm the complete template reaches the clipboard.
7. Create a matching cover letter from a resume and confirm the resume is unchanged.
8. Toggle light/dark and reload: the theme persists, while both documents are cleared.
9. Export PDF and DOCX for both documents and confirm text is selectable/editable.
10. Check the layout at desktop and phone widths.
11. Confirm `/robots.txt` and `/sitemap.xml` resolve and list only the canonical domain.
12. Inspect the network panel: only same-origin document and asset requests.
13. Confirm the security and cache headers with `curl -I`.
14. Confirm GitHub Actions CI is green.

## Rollback

Use the Vercel dashboard for the `openresume` project: open **Deployments**, select the last known-good production deployment, and promote or roll back to it. Application versions and Git tags are unchanged by a rollback.
