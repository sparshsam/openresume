# Contributing

## Scope

Contributions are welcome in the form of bug reports, documentation fixes, accessibility improvements, tests, and focused code changes that respect the project's invariants. OpenResume is intentionally small; features that add infrastructure (accounts, sync, analytics, AI) are out of scope.

## Process

1. Open an issue describing the problem or proposal.
2. Fork the repository.
3. Create a branch named `<type>/<description>` — `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, or `test/`.
4. Make the change and add or update tests.
5. Run `npm run check`.
6. Submit a pull request using the template.

## Standards

All contributions follow shared Kovina ecosystem standards for structure, documentation, tone, and security, and the public [Kovina standards](https://github.com/sparshsam/kovina/tree/main/standards) where they do not conflict.

## Coding expectations

- Keep parsing, layout, rendering, and export logic separate.
- Preserve exact user content unless an edit is explicit.
- Do not introduce network calls, telemetry, or new storage locations.
- Prefer a pure function in `src/lib/` over logic inside a component.
- Update `CHANGELOG.md` for user-visible changes.

## Commit messages

```text
type: short description

Optional body explaining motivation and trade-offs.
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
