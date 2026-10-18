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

The parser reports `documentCount`. Keep the import dialog's rejection of multiple top-level headings; it is the last line of defense against mixed documents.

## Page sizes and formatting

All geometry and typography flow from `src/lib/metrics.ts`:

1. Add or change presets there, not in a component or exporter.
2. Update `docs/formatting.md` and the control labels in `FormattingPanel.tsx`.
3. Add metric tests for the new values and keep the column-geometry invariant (`main + side + gap = content width`, side ≥ 100 pt).
4. Verify preview bounds and both exports for every supported page size.

The DOCX exporter maps spacing presets to Word line values (240/276/330 twips). If those mappings change, update `wordLineTwips` in metrics and the DOCX tests.

## Release checklist

- [ ] `npm run check` passes.
- [ ] `CHANGELOG.md` has the release entry.
- [ ] `package.json` version is bumped.
- [ ] Sample resume and screenshots are current.
- [ ] PDF and DOCX exports manually verified on US Letter, A4, and US Legal.
- [ ] Repeated import leaves only the newest document in both exports.
- [ ] Formatting panel changes preview and both exports; Reset to defaults works.
- [ ] Tag created and GitHub release notes published.

## Known maintenance risks

- Browser font substitution can shift line wrapping slightly if the document font stack changes. Keep `Helvetica, Arial, "Liberation Sans", sans-serif` aligned with the embedded AFM metrics.
- DOCX page tables mirror the PDF page model. Changing pagination affects both exporters; update both tests.
