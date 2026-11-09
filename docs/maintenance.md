# Maintenance

## Routine checks

```bash
npm ci
npm run check          # lint, typecheck, tests, production build
npm run format:check   # CI runs this; `check` does not
npm audit
```

CI runs lint, format check, typecheck, tests, and build on every push and pull request.

## Dependency updates

Runtime dependencies are limited to React, jsPDF, and docx. Before upgrading:

1. Read the release notes for breaking changes.
2. Run `npm run check`.
3. Manually export one PDF and one DOCX and confirm text is selectable/editable.
4. Confirm the initial bundle has not regressed (`npm run build` output).

Major upgrades to jsPDF or docx deserve a visual comparison against the previous export.

## Icons

Icons and social assets are generated from the authoritative masters in `assets/branding/source-assets/`; they are never hand-edited:

```bash
python3 scripts/generate-icons.py
```

This writes `assets/app-icon/icon-source.png`, the light/dark web icons, and the social card. Replacing the official icon means updating the authoritative masters or the drawing in the script, then regenerating. The interface uses the light artwork in both themes through `src/lib/themeAssets.ts`.

## Draft schema changes

Documents are session-only; there is no draft loader. `schemaVersion` remains `1` for the in-memory model. Legacy v0.1.x draft keys are removed by `clearLegacyDrafts()` after validation with `isResume`/`isCoverLetter`.

If the `Resume` or `CoverLetter` shape changes incompatibly:

1. Increment `schemaVersion`.
2. Update `clearLegacyDrafts()` validation and the legacy-key behavior so old payloads are never restored.
3. Update both parsers, the editors, layout, exporters, and fixtures.
4. Add a test for the old payload and the cleanup/fallback.
5. Note the change in `CHANGELOG.md` and `VERSIONING.md`.

## Input format changes

Additive aliases or markers are minor changes. Removing or redefining a marker is breaking. Update `docs/input-format.md`, parser tests, and the serializer round-trip test together.

The parser reports `documentCount`. Keep preparation's rejection of multiple top-level headings; it is the last line of defense against mixed documents.

## Page sizes and formatting

All geometry and typography flow from `src/lib/metrics.ts`:

1. Add or change presets there, not in a component or exporter.
2. Update `docs/formatting.md` and the control labels in `FormattingPanel.tsx`.
3. Add metric tests for the new values and keep the column-geometry invariant (`main + side + gap = content width`, side ≥ 100 pt).
4. Verify preview bounds and both exports for every supported page size.

The DOCX exporter maps spacing presets to Word line values (240/276/330 twips). If those mappings change, update `wordLineTwips` in metrics and the DOCX tests.

## Guided contract changes

The `/prepare` Job Directory contract is validated in `src/lib/jobContext.ts` and documented in `docs/job-directory-integration.md`.

- Additive optional parameters do not bump `contract`; version 1 readers ignore unknown keys.
- Changing or removing an existing field's meaning is breaking: bump `contract`, keep reading version 1 fields with a warning, and document the migration.
- Every new field needs limits, URL-scheme validation if applicable, prompt handling if it can affect tailoring, and tests in `tests/jobContext.test.ts` and `tests/guidedPrompt.test.ts`.
- Never add applicant names, emails, résumés, or generated documents to the query contract.

## Release checklist

- [ ] `npm run check` passes.
- [ ] `npm run format:check` passes.
- [ ] `CHANGELOG.md` has the release entry.
- [ ] `package.json`, `package-lock.json`, and `src/lib/appMeta.ts` versions agree.
- [ ] Sample resume and screenshots are current.
- [ ] PDF and DOCX exports verified by the maintainer on US Letter, A4, and US Legal.
- [ ] Repeated build leaves only the newest document in both exports.
- [ ] Formatting panel changes preview and both exports; Reset to defaults works.
- [ ] Tag created and GitHub prerelease notes published.
- [ ] Production deployment READY; `/`, `/about`, `/privacy`, `/terms`, and `/prepare` return 200.

## Known maintenance risks

- Browser font substitution can shift line wrapping slightly if the document font stack changes. Keep `Helvetica, Arial, "Liberation Sans", sans-serif` aligned with the embedded AFM metrics.
- DOCX page tables mirror the PDF page model. Changing pagination affects both exporters; update both tests.
