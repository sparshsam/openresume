# Maintenance

## Routine checks

```bash
npm ci
npm run check          # lint, typecheck, tests, production build
npm audit
```

CI runs the same commands on every push and pull request.

## Dependency updates

Runtime dependencies are limited to React, jsPDF, and docx. Before upgrading:

1. Read the release notes for breaking changes.
2. Run `npm run check`.
3. Manually export one PDF and one DOCX and confirm text is selectable/editable.
4. Confirm the initial bundle has not regressed (`npm run build` output).

Major upgrades to jsPDF or docx deserve a visual comparison against the previous export.

## Icons

The placeholder icon is generated, not hand-edited:

```bash
python3 scripts/generate-icons.py
```

This writes `assets/app-icon/icon-source.png` and the favicon set in `public/`. Replacing the official icon means replacing the drawing in the script or swapping the canonical source, then regenerating.

## Draft schema changes

`schemaVersion` is `1`. If the `Resume` shape changes incompatibly:

1. Increment `schemaVersion`.
2. Either add a migration in `loadDraft` or change `DRAFT_KEY`.
3. Extend `isResume` validation.
4. Add a test for the old payload and the migration/fallback.
5. Note the change in `CHANGELOG.md` and `VERSIONING.md`.

## Input format changes

Additive aliases or markers are minor changes. Removing or redefining a marker is breaking. Update `docs/input-format.md`, parser tests, and the serializer round-trip test together.

## Release checklist

- [ ] `npm run check` passes.
- [ ] `CHANGELOG.md` has the release entry.
- [ ] `package.json` version is bumped.
- [ ] Sample resume and screenshots are current.
- [ ] PDF and DOCX exports manually verified.
- [ ] Tag created and GitHub release notes published.

## Known maintenance risks

- Browser font substitution can shift line wrapping slightly if the document font stack changes. Keep `Helvetica, Arial, "Liberation Sans", sans-serif` aligned with the embedded AFM metrics.
- DOCX page tables mirror the PDF page model. Changing pagination affects both exporters; update both tests.
