"""Generates the temporary Lumera app icons (PNG + SVG). Replace with real brand art any time:
   put your own files at the same paths in public/icons/ (or edit this script and run `npm run icons`)."""
from PIL import Image, ImageDraw
import os

BRAND = (63, 37, 99); ACCENT = (232, 102, 76); OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUT, exist_ok=True)

def star(draw, cx, cy, r, fill):
    # 4-point sparkle: concave diamond
    k = 0.22
    pts = [(cx, cy - r), (cx + r * k, cy - r * k), (cx + r, cy), (cx + r * k, cy + r * k),
           (cx, cy + r), (cx - r * k, cy + r * k), (cx - r, cy), (cx - r * k, cy - r * k)]
    draw.polygon(pts, fill=fill)

def render(size, rounded=True, glyph=0.5):
    s = size * 4  # supersample
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded: d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=BRAND)
    else: d.rectangle((0, 0, s, s), fill=BRAND)
    star(d, s / 2, s / 2, s * glyph / 2 * 1.9, ACCENT)
    return img.resize((size, size), Image.LANCZOS)

render(192).save(f'{OUT}/icon-192.png')
render(512).save(f'{OUT}/icon-512.png')
render(512, rounded=False, glyph=0.36).save(f'{OUT}/maskable-512.png')   # full-bleed, glyph inside the 80% safe zone
render(180, rounded=False, glyph=0.5).save(f'{OUT}/apple-touch-icon.png')  # iOS rounds the corners itself
render(32).save(f'{OUT}/favicon-32.png')

open(f'{OUT}/icon.svg', 'w').write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#3f2563"/><path d="M16 5c1.3 5.4 4.1 8.2 9.5 9.5-5.4 1.3-8.2 4.1-9.5 9.5-1.3-5.4-4.1-8.2-9.5-9.5C11.9 13.2 14.7 10.4 16 5Z" fill="#e8664c"/></svg>''')

# SVG placeholders for demo data (avatars, covers, portfolio, interiors) — swap for real uploads later.
IMG = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'placeholder')
os.makedirs(IMG, exist_ok=True)
PALETTES = [('#3f2563', '#e8664c'), ('#1f4e5f', '#f2b880'), ('#5b2a3c', '#f4c7a1'), ('#26334d', '#9fb8e8'),
            ('#3d4f2f', '#e5d58a'), ('#4a2c5e', '#f09ab4'), ('#2b2b3a', '#d9a066'), ('#124559', '#98c1d9')]

def svg(w, h, a, b, shape):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">'
            f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'<rect width="{w}" height="{h}" fill="url(#g)"/>{shape}</svg>')

for i in range(6):
    a, b = PALETTES[i]
    open(f'{IMG}/avatar-{i+1}.svg', 'w').write(svg(256, 256, a, b, '<circle cx="128" cy="100" r="46" fill="#fff" fill-opacity=".85"/><path d="M40 256c8-60 48-90 88-90s80 30 88 90Z" fill="#fff" fill-opacity=".85"/>'))
for i in range(4):
    a, b = PALETTES[i + 2]
    open(f'{IMG}/cover-{i+1}.svg', 'w').write(svg(1200, 400, a, b, '<circle cx="980" cy="120" r="160" fill="#fff" fill-opacity=".12"/><circle cx="200" cy="330" r="120" fill="#fff" fill-opacity=".1"/>'))
for i in range(8):
    a, b = PALETTES[i]
    open(f'{IMG}/portfolio-{i+1}.svg', 'w').write(svg(800, 1000, a, b, f'<path d="M400 260c30 120 100 190 220 220-120 30-190 100-220 220-30-120-100-190-220-220 120-30 190-100 220-220Z" fill="#fff" fill-opacity=".8"/><text x="400" y="900" text-anchor="middle" font-family="sans-serif" font-size="36" fill="#fff" fill-opacity=".6">placeholder {i+1}</text>'))
for i in range(3):
    a, b = PALETTES[i + 4]
    open(f'{IMG}/interior-{i+1}.svg', 'w').write(svg(1200, 800, a, b, '<rect x="140" y="420" width="920" height="26" fill="#fff" fill-opacity=".5"/><rect x="220" y="240" width="200" height="180" fill="#fff" fill-opacity=".25"/><rect x="760" y="240" width="200" height="180" fill="#fff" fill-opacity=".25"/>'))
print('icons + placeholders generated')
