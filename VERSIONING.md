# Versioning

OpenResume follows [Semantic Versioning 2.0](https://semver.org/) with a pre-1.0 convention tuned for a small, fast-moving tool.

## Current line

`0.1.x` — early development.

## Rules

| Change                                                          | Version                           |
| --------------------------------------------------------------- | --------------------------------- |
| New feature, template, export capability, or workflow addition  | `0.x.0`                           |
| Fix, refinement, accessibility improvement, or minor adjustment | `0.x.y`                           |
| Breaking change to the input format or stored draft schema      | `0.(x+1).0` with a migration note |

- `MAJOR` remains `0` until the input format, draft schema, and export contract are stable.
- Pre-release identifiers (`-beta`, `-rc`) may be used for larger milestones.
- Every release updates `CHANGELOG.md` and the `version` field in `package.json`.

## Compatibility commitments

- Drafts are versioned by storage key and `schemaVersion`. A breaking draft change requires a new key or a migration.
- The input format is documented in `docs/input-format.md`. Additive markers are minor changes; removing or redefining one is breaking.
