#!/usr/bin/env python3
"""Generate placeholder App Store assets for Pixel Math Quest.

Pure-stdlib (zlib only) PNG writer so it runs anywhere with no pip installs.
Produces crisp, non-antialiased pixel art:

  icon.png        1024x1024  "PMQ" on the game's primary color (--accent)
  splash.png      2732x2732  centered logo on the game's base color (--bg)
  splash-dark.png 2732x2732  centered logo on a darker base (dark mode)

These are throwaway placeholders. Drop in a real 1024x1024 icon and re-run
`npx capacitor-assets generate --ios` (see README.md). Re-run this script with
`python3 assets/generate_placeholder_assets.py` to regenerate the placeholders.
"""

import os
import struct
import zlib

# --- Brand palette (mirrors src/App.css :root custom properties) ---
ACCENT = (0xE9, 0x45, 0x60)   # --accent  (primary color)
BASE = (0x1A, 0x1A, 0x2E)     # --bg      (base background)
BASE_DARK = (0x12, 0x12, 0x1E)  # darker base for dark-mode splash
SHADOW = (0x0F, 0x34, 0x60)   # in-game title text-shadow color
WHITE = (0xFF, 0xFF, 0xFF)

# 5x7 pixel glyphs ('1' = pixel on), matching the chunky retro look.
GLYPHS = {
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "M": ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
}
GLYPH_W, GLYPH_H = 5, 7


def new_canvas(w, h, color):
    """RGB framebuffer (no alpha: App Store icons must be opaque)."""
    return bytearray(bytes(color) * (w * h)), w, h


def fill_rect(buf, w, x, y, rw, rh, color):
    row = bytes(color) * rw
    for yy in range(y, y + rh):
        start = (yy * w + x) * 3
        buf[start:start + rw * 3] = row


def draw_pmq(buf, w, cx, cy, scale, fg, shadow):
    """Draw 'PMQ' centered at (cx, cy) with a 1-unit drop shadow."""
    text = "PMQ"
    cols = len(text) * GLYPH_W + (len(text) - 1)  # 1-cell gap between letters
    total_w = cols * scale
    total_h = GLYPH_H * scale
    ox = cx - total_w // 2
    oy = cy - total_h // 2
    soff = max(2, scale // 6)

    pen = ox
    for ch in text:
        glyph = GLYPHS[ch]
        for ry in range(GLYPH_H):
            for rx in range(GLYPH_W):
                if glyph[ry][rx] == "1":
                    px = pen + rx * scale
                    py = oy + ry * scale
                    fill_rect(buf, w, px + soff, py + soff, scale, scale, shadow)
                    fill_rect(buf, w, px, py, scale, scale, fg)
        pen += (GLYPH_W + 1) * scale


def write_png(path, buf, w, h):
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    raw = bytearray()
    stride = w * 3
    for y in range(h):
        raw.append(0)  # filter type 0 (None)
        raw.extend(buf[y * stride:(y + 1) * stride])

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def make_icon(path):
    w = h = 1024
    buf, w, h = new_canvas(w, h, ACCENT)
    # Thin retro frame for a touch of app-icon polish.
    border = 28
    fill_rect(buf, w, 0, 0, w, border, SHADOW)
    fill_rect(buf, w, 0, h - border, w, border, SHADOW)
    fill_rect(buf, w, 0, 0, border, h, SHADOW)
    fill_rect(buf, w, w - border, 0, border, h, SHADOW)
    draw_pmq(buf, w, w // 2, h // 2, 37, WHITE, SHADOW)
    write_png(path, buf, w, h)


def make_splash(path, bg):
    w = h = 2732
    buf, w, h = new_canvas(w, h, bg)
    # Centered accent "logo tile" with the PMQ mark, echoing the app icon.
    tile = 1180
    tx, ty = (w - tile) // 2, (h - tile) // 2
    fill_rect(buf, w, tx, ty, tile, tile, ACCENT)
    draw_pmq(buf, w, w // 2, h // 2, 49, WHITE, SHADOW)
    write_png(path, buf, w, h)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    make_icon(os.path.join(here, "icon.png"))
    make_splash(os.path.join(here, "splash.png"), BASE)
    make_splash(os.path.join(here, "splash-dark.png"), BASE_DARK)
    print("Generated icon.png, splash.png, splash-dark.png")


if __name__ == "__main__":
    main()
