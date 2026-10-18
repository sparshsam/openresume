# OpenResume source masters

These two PNG files are the authoritative logo masters for OpenResume. They are
copied byte-for-byte from the Kovina app asset folder and must never be edited,
resized, recoloured, or regenerated in place.

| File                       | Mode  | Size          | SHA-256                                                            |
| -------------------------- | ----- | ------------- | ------------------------------------------------------------------ |
| `openresume_lightmode.png` | Light | 1024×1024 RGB | `82140bd0335ff131d27ec88e91bf4469aee8430fd982e69a963fc7bcd700b8d8` |
| `openresume_darkmode.png`  | Dark  | 1024×1024 RGB | `a3671a86d5a9b7f25b0426b615fade186c3a2dbcac8865ba306b171f7a119d25` |

Both masters use the same artwork geometry: a dark forest-green résumé mark
(`#1a2818`) on a light `#f9f9f9` field or a black `#000000` field. The marks are
not recoloured or otherwise reinterpreted during generation.

A third file, `openresume_master.png`, exists in the original OneDrive folder.
It is an inverse presentation (cream mark on a forest-green field) and is not one
of the two supplied light/dark masters. It is left untouched and is not used by
the icon pipeline.

## Regeneration

From the repository root:

```bash
python3 scripts/generate-icons.py
```

To refresh the review copy outside the repository:

```bash
python3 scripts/generate-icons.py \
  --brand-out "/mnt/c/Users/spars/OneDrive/Kovina/Apps Stuff/openresume/openresume-brand-assets"
```

The script crops each master to its artwork bounds, scales proportionally with
Lanczos resampling, and centers the mark on a square canvas with a 12% safe
margin. It never alters the source files.

See [docs/branding.md](../../../docs/branding.md) for the full inventory and
design constraints.
