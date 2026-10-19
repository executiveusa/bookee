#!/usr/bin/env python3
# KDP marketing cover: 1600x2560 JPEG, RGB, typographic placeholder (title + author).
import argparse, textwrap
from PIL import Image, ImageDraw, ImageFont

p = argparse.ArgumentParser()
p.add_argument("--title", required=True)
p.add_argument("--author", default="")
p.add_argument("--out", required=True)
a = p.parse_args()

W, H = 1600, 2560
BG = (122, 31, 47)   # Bookee burgundy
GOLD = (212, 175, 106)
CREAM = (243, 234, 210)
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)
d.rectangle([90, 90, W - 90, H - 90], outline=GOLD, width=4)
d.rectangle([110, 110, W - 110, H - 110], outline=GOLD, width=1)

def font(sz, bold=True):
    p = "/usr/share/fonts/truetype/dejavu/DejaVuSerif%s.ttf" % ("-Bold" if bold else "")
    try: return ImageFont.truetype(p, sz)
    except Exception: return ImageFont.load_default()

def wrap(t, f, maxw):
    words, lines, cur = t.split(), [], ""
    for w in words:
        t2 = (cur + " " + w).strip()
        if d.textlength(t2, font=f) <= maxw: cur = t2
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

title_font = font(96)
lines = wrap(a.title, title_font, W - 400)
y = H // 2 - len(lines) * 60 - 120
for ln in lines:
    w = d.textlength(ln, font=title_font)
    d.text(((W - w) / 2, y), ln, font=title_font, fill=CREAM)
    y += 120
d.line([(W // 2 - 120, y + 30), (W // 2 + 120, y + 30)], fill=GOLD, width=3)
if a.author:
    af = font(56, bold=False)
    aw = d.textlength(a.author.upper(), font=af)
    d.text(((W - aw) / 2, H - 500), a.author.upper(), font=af, fill=GOLD)
img.save(a.out, "JPEG", quality=90, dpi=(300, 300))
print(a.out)
