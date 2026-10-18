# Branding and icon assets

OpenResume follows the Kovina ecosystem branding standards. The authoritative
visual source is the pair of supplied PNG masters; this repository only derives
platform assets from them.

## Standards

Read alongside this document:

- `kovina/standards/shared/APP_ICON_STANDARD.md`
- `kovina/standards/shared/ACCESSIBILITY_STANDARD.md`
- `kovina/standards/platforms/WEBSITE_STANDARD.md`
- `kovina/standards/platforms/PWA_STANDARD.md`
- `kovina/standards/foundational/BRAND_GUIDELINES.md`
- `kovina/standards/process/PROJECT_STRUCTURE_STANDARD.md`
- `ecosystem-standards/standards/repository-structure.md`
- `ecosystem-standards/standards/documentation-standard.md`
- `ecosystem-standards/standards/naming-conventions.md`
- `ecosystem-standards/standards/security-standard.md`
- `ecosystem-standards/standards/release-standard.md`

Where the standards expect a single transparent canonical icon source and the
supplied product masters provide light/dark fields, the product masters win:
OpenResume keeps both authoritative variants and derives all assets from them.
The mismatch is recorded in [Standards notes](#standards-notes).

## Source masters

| Master                     | Mode  | Dimensions | Color mode | SHA-256                                                            |
| -------------------------- | ----- | ---------- | ---------- | ------------------------------------------------------------------ |
| `openresume_lightmode.png` | Light | 1024×1024  | RGB        | `82140bd0335ff131d27ec88e91bf4469aee8430fd982e69a963fc7bcd700b8d8` |
| `openresume_darkmode.png`  | Dark  | 1024×1024  | RGB        | `a3671a86d5a9b7f25b0426b615fade186c3a2dbcac8865ba306b171f7a119d25` |

Both files are RGB, 1024×1024, sRGB-oriented (no embedded ICC profile), with a
96 dpi metadata tag. They are not transparent: the light field is `#f9f9f9`,
the dark field is `#000000`, and the artwork is `#1a2818`. The masters are
preserved byte-for-byte in `assets/branding/source-assets/` and copied to
`assets/app-icon/icon-source.png` for the canonical-source path.

The extra `openresume_master.png` in the OneDrive folder is an inverse
presentation, not one of the two supplied variants. It is left untouched and is
not used.

## Generation

```bash
python3 scripts/generate-icons.py
```

The script requires Pillow. It:

1. reads both masters;
2. detects the background from the corner pixel and crops to the artwork bounds;
3. scales proportionally with Lanczos resampling;
4. centers the mark on a square canvas with a 12% safe margin per side;
5. writes the generated light and dark sets and a multi-resolution ICO;
6. copies the masters and writes a review folder when `--brand-out` is supplied.

No image-generation service, icon package, runtime dependency, or network request
is involved.

## Asset inventory

### Light

| Asset                | Size       | Runtime path                          |
| -------------------- | ---------- | ------------------------------------- |
| Favicon PNG          | 16×16      | `public/favicon-16.png`               |
| Favicon PNG          | 32×32      | `public/favicon-32.png`               |
| Favicon ICO          | 16, 32, 48 | `public/favicon.ico`                  |
| Apple touch icon     | 180×180    | `public/apple-touch-icon.png`         |
| Apple touch fallback | 152×152    | `public/apple-touch-icon-152x152.png` |
| Microsoft tile       | 150×150    | `public/mstile-150x150.png`           |
| Application icon     | 192×192    | `public/icon-192.png`                 |
| Application icon     | 512×512    | `public/icon-512.png`                 |
| Social preview       | 1200×630   | `public/openresume-social.png`        |

Generated copies live in `assets/app-icon/light/`, including the multi-resolution `favicon.ico`.

### Dark

| Asset            | Size    | Runtime path                 |
| ---------------- | ------- | ---------------------------- |
| Favicon PNG      | 16×16   | `public/favicon-16-dark.png` |
| Favicon PNG      | 32×32   | `public/favicon-32-dark.png` |
| Application icon | 192×192 | `public/icon-192-dark.png`   |
| Application icon | 512×512 | `public/icon-512-dark.png`   |

Generated copies live in `assets/app-icon/dark/`. Apple touch icons use the
light master because iOS does not support themed home-screen icons; the ICO
fallback also uses the light master.

## Runtime integration

- `index.html` declares the ICO, light 16/32 PNGs, Apple touch icons, Microsoft
  tile, Open Graph image, and Twitter card.
- The light favicon is the initial value. The inline pre-hydration theme script
  and `ThemeProvider` switch the 16/32 links to the dark variants when the app
  theme is dark, including a user-forced theme.
- `Header` uses `icon-192.png` in light mode and `icon-192-dark.png` in dark mode.
- `theme-color` follows the interface theme (`#f4f5f2` light, `#0f1210` dark).
- All assets are same-origin; there is no icon CDN or runtime request.

## Deliberately not generated

- **SVG.** The masters are raster artwork. A faithful vector conversion is not
  possible, and embedding raster data in an SVG would be misleading.
- **PWA manifest and service worker.** OpenResume is not a PWA: it has no
  offline capability and its documents are intentionally session-only. The
  192/512 PNGs are present as application icons and are ready for a future PWA
  decision, but no manifest or service worker is added solely for icons.
- **Android/iOS/macOS/Windows packaged-app sets.** OpenResume ships as a web
  application only. The web and legacy Microsoft tile assets are the applicable
  surfaces.

## Verification

- `tests/assets.test.ts` checks every generated PNG signature and dimension, the
  multi-resolution ICO header, non-empty files, and the light master copy.
- `npm run check` covers formatting, lint, typecheck, tests, and the production
  build.
- Visual checks cover the 32 px light and dark favicons, the 192 px header mark,
  and the 1200×630 social card.
- The dark master is intentionally low-contrast on black; it is reproduced
  without recolouring per the source-master requirement.

## Standards notes

The following larger gaps are recorded rather than silently expanding scope:

- The shared app-icon standard describes one transparent 1024×1024 source;
  OpenResume uses the two supplied opaque light/dark masters instead.
- OpenResume is a Web-First application (Archetype A), for which the website
  standard expects a PWA. The app does not currently implement offline support,
  a manifest, or a service worker.
- The website standard also expects `robots.txt`, `sitemap.xml`, privacy, and
  terms pages; those are not part of this branding release.
