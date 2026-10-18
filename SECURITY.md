# Security Policy

## Reporting a vulnerability

Please report security issues privately, not in a public issue.

- Open a [GitHub security advisory](https://github.com/sparshsam/openresume/security/advisories/new), or
- Email **sparshsam@gmail.com** with a description, reproduction steps, impact, and any suggested fix.

You will receive an acknowledgement within a few business days. Please allow time for a fix before public disclosure.

## Scope

OpenResume is a client-only application. Its security surface is deliberately small:

- No backend, API, authentication, or session handling.
- No runtime network requests.
- No telemetry or third-party scripts.
- No environment variables or secrets.
- Documents live in memory for the current session; only the interface theme is stored in `localStorage`.

Relevant reports include cross-site scripting through imported text, unsafe rendering of user content, dependency vulnerabilities with a reachable path, and document content leaving the browser through an unintended path.

## Supported versions

| Version      | Supported                     |
| ------------ | ----------------------------- |
| Latest `0.x` | Yes                           |
| Older        | Upgrade to the latest release |

## Practices

- `.env` files are gitignored; this project does not require any.
- User content is rendered as text, never as HTML.
- Dependencies are kept minimal and reviewed before addition.
- Exports are generated locally from the same in-memory model as the preview.

For the ecosystem-wide security standard, see [ecosystem-standards](https://github.com/sparshsam/ecosystem-standards).
