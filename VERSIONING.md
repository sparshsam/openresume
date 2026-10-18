# Versioning

OpenResume follows [Semantic Versioning 2.0](https://semver.org/) with a pre-1.0 convention tuned for a small, fast-moving tool.

## Current line

`0.1.x` — early development.

## Rules

| Change                                                          | Version                           |
| --------------------------------------------------------------- | --------------------------------- |
| New feature, template, export capability, or workflow addition  | `0.x.0`                           |
| Fix, refinement, accessibility improvement, or minor adjustment | `0.x.y`                           |
| Breaking change to the input format or document schema          | `0.(x+1).0` with a migration note |

- `MAJOR` remains `0` until the input format, document schema, and export contract are stable.
- Pre-release identifiers (`-beta`, `-rc`) may be used for larger milestones.
- Every release updates `CHANGELOG.md` and the `version` field in `package.json`.

## Compatibility commitments

- Documents are session-only and are not stored in the browser. The model `schemaVersion` still identifies structural changes for legacy cleanup and tests.
- The input format is documented in `docs/input-format.md`. Additive markers are minor changes; removing or redefining one is breaking.
