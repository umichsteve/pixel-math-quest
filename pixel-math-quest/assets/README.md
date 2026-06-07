# App assets

These are the **source** images that [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets)
reads to generate every iOS icon and splash size. They live here (outside the
native `ios/` project) so they can be regenerated at any time.

| File              | Size        | Purpose                                            |
| ----------------- | ----------- | -------------------------------------------------- |
| `icon.png`        | 1024 × 1024 | App icon (pixel-art "PMQ" on the primary color)    |
| `splash.png`      | 2732 × 2732 | Launch screen — light mode                         |
| `splash-dark.png` | 2732 × 2732 | Launch screen — dark mode                          |

## ⚠️ TODO: replace the placeholder icon

`icon.png` is a throwaway placeholder. **Drop in a real 1024 × 1024 `icon.png`**
(opaque, no alpha channel — App Store rejects icons with transparency) before
submitting, then regenerate the native assets:

```bash
npx capacitor-assets generate --ios
npx cap sync ios
```

## Regenerating the placeholders

The placeholders are produced by a dependency-free script (Python stdlib only):

```bash
python3 assets/generate_placeholder_assets.py
```

Colors mirror `src/App.css` (`--accent` #e94560 primary, `--bg` #1a1a2e base).
