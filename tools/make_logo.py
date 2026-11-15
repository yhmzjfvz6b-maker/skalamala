"""Erzeugt das Skalamala-Logo als SVG (Schrift in Pfade umgewandelt, unabhängig von installierten Schriften)."""
import math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

BLACK = TTFont('/usr/share/fonts/opentype/inter/InterDisplay-Black.otf')
BOLD = TTFont('/usr/share/fonts/opentype/inter/InterDisplay-Black.otf')
SYM = TTFont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')


def glyph_path(font, ch, size, cx=None, cy=None, x=None, baseline=None):
    """Pfad eines Zeichens; zentriert auf (cx, cy) oder an (x, baseline)."""
    gs = font.getGlyphSet()
    name = font.getBestCmap()[ord(ch)]
    upm = font['head'].unitsPerEm
    s = size / upm
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    xmin, ymin, xmax, ymax = bp.bounds
    if cx is not None:
        tx = cx - (xmin + xmax) / 2 * s
        ty = cy + (ymin + ymax) / 2 * s
    else:
        tx, ty = x, baseline
    pen = SVGPathPen(gs)
    gs[name].draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
    return pen.getCommands(), gs[name].width * s


def text_path(font, text, size, x, baseline, tracking=0):
    out, cx = [], x
    for ch in text:
        if ch == ' ':
            cx += size * 0.28 + tracking
            continue
        d, adv = glyph_path(font, ch, size, x=cx, baseline=baseline)
        out.append(d)
        cx += adv + tracking
    return ' '.join(out), cx - x - tracking


def text_width(font, text, size, tracking=0):
    return text_path(font, text, size, 0, 0, tracking)[1]


def star(cx, cy, r, fill, rot=0):
    pts = []
    for i in range(8):
        a = math.radians(rot + i * 45)
        rr = r if i % 2 == 0 else r * 0.32
        pts.append(f'{cx + rr * math.sin(a):.1f},{cy - rr * math.cos(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>'


JESTER = '''<g>
  <path d="M14 72 C20 48 30 30 50 22 C70 30 80 48 86 72 Z" fill="#e5262f" stroke="#0a1e66" stroke-width="3"/>
  <path d="M14 72 C10 48 4 34 6 20 C22 30 34 44 40 60 Z" fill="#ffd23f" stroke="#0a1e66" stroke-width="3"/>
  <path d="M86 72 C90 48 96 34 94 20 C78 30 66 44 60 60 Z" fill="#2f6fe8" stroke="#0a1e66" stroke-width="3"/>
  <path d="M40 60 C44 40 47 24 50 6 C53 24 56 40 60 60 Z" fill="#2bb24c" stroke="#0a1e66" stroke-width="3"/>
  <rect x="9" y="66" width="82" height="16" rx="8" fill="#ffd23f" stroke="#0a1e66" stroke-width="3"/>
  <circle cx="6" cy="17" r="7.5" fill="#ffd23f" stroke="#0a1e66" stroke-width="3"/>
  <circle cx="94" cy="17" r="7.5" fill="#ffd23f" stroke="#0a1e66" stroke-width="3"/>
  <circle cx="50" cy="5" r="7.5" fill="#ffd23f" stroke="#0a1e66" stroke-width="3"/>
</g>'''


def build(with_burst=True):
    W, H = 1260, 760
    word = 'SKALAMALA'
    suits = ['♥', '♠', '♦', '♣', '♥', '♠', '♦', '♣', '♥']
    tw, th, gap = 112, 152, 10
    total = len(word) * tw + (len(word) - 1) * gap
    x0 = (W - total - 70) / 2
    base_y = 420
    parts = []
    defs = '''<defs>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#ffe66d" stop-opacity=".95"/>
    <stop offset=".55" stop-color="#ff9417" stop-opacity=".35"/>
    <stop offset="1" stop-color="#ff9417" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="fade" cx="50%" cy="50%" r="50%">
    <stop offset=".25" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="raymask" maskUnits="userSpaceOnUse" x="0" y="0" width="1260" height="760">
    <ellipse cx="630" cy="350" rx="600" ry="330" fill="url(#fade)"/>
  </mask>
  <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef2fb"/>
  </linearGradient>
  <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ff4d55"/><stop offset="1" stop-color="#c8141f"/>
  </linearGradient>
</defs>'''
    if with_burst:
        rays = []
        cx, cy = W / 2, 350
        for i in range(24):
            a1 = math.radians(i * 15 - 3.5)
            a2 = math.radians(i * 15 + 3.5)
            R = 520
            rays.append(f'M{cx:.0f},{cy:.0f} L{cx + R * math.cos(a1):.0f},{cy + R * math.sin(a1):.0f} L{cx + R * math.cos(a2):.0f},{cy + R * math.sin(a2):.0f} Z')
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="520" ry="300" fill="url(#glow)"/>')
        parts.append(f'<path d="{" ".join(rays)}" fill="#ffd23f" opacity=".3" mask="url(#raymask)"/>')

    # Karten mit Buchstaben – steigen wie eine Skala im Bogen an, abwechselnd rot/schwarz
    tiles = []
    for i, ch in enumerate(word):
        t = i / (len(word) - 1)
        x = x0 + i * (tw + gap)
        y = base_y - th - 70 * math.sin(math.pi * t) - 26 * t  # Bogen + leichter Anstieg
        rot = (-7 if i % 2 == 0 else 6) * (1 - 0.3 * math.sin(math.pi * t))
        red = i % 2 == 0
        col = '#e3262b' if red else '#18181b'
        letter, _ = glyph_path(BLACK, ch, 96, cx=tw / 2, cy=th / 2 + 4)
        suit, _ = glyph_path(SYM, suits[i], 22, cx=21, cy=23)
        suit2, _ = glyph_path(SYM, suits[i], 22, cx=tw - 21, cy=th - 23)
        tiles.append(f'''<g transform="translate({x:.1f},{y:.1f}) rotate({rot:.1f} {tw / 2} {th / 2})">
  <rect x="5" y="9" width="{tw}" height="{th}" rx="16" fill="#0a1e66" opacity=".55"/>
  <rect x="0" y="0" width="{tw}" height="{th}" rx="16" fill="url(#tile)" stroke="#0a1e66" stroke-width="6"/>
  <rect x="9" y="9" width="{tw - 18}" height="{th - 18}" rx="10" fill="none" stroke="{'#ffd23f' if red else '#3fa9ff'}" stroke-width="3" opacity=".9"/>
  <path d="{suit}" fill="{col}"/>
  <path d="{suit2}" fill="{col}" transform="rotate(180 {tw - 21} {th - 23})"/>
  <path d="{letter}" fill="{col}"/>
</g>''')
        if i == 0:
            hat_pos = (x, y, rot)
    parts.extend(tiles)

    # Narrenkappe auf dem S
    hx, hy, hr = hat_pos
    parts.append(f'<g transform="translate({hx - 34:.1f},{hy - 104:.1f}) rotate(-16 70 60) scale(1.45)">{JESTER}</g>')

    # Ausrufezeichen als eigenes Element am Ende
    lx = x0 + total + 16
    ly = base_y - th - 26 - 20
    ex, _ = glyph_path(BLACK, '!', 150, cx=lx + 30, cy=ly + 70)
    parts.append(f'<g transform="rotate(12 {lx + 30} {ly + 70})"><path d="{ex}" fill="#0a1e66" transform="translate(5,7)"/><path d="{ex}" fill="#ffd23f" stroke="#0a1e66" stroke-width="5" paint-order="stroke"/></g>')

    # Band mit Untertitel
    sub = 'DAS VERRÜCKTE KARTENSPIEL'
    fs = 44
    trk = 4
    sw = text_width(BOLD, sub, fs, trk)
    rw = sw + 110
    rx = (W - rw) / 2
    ry = base_y + 40
    rh = 74
    parts.append(f'''<g>
  <path d="M{rx - 46:.0f},{ry + 22} L{rx + 20:.0f},{ry + 22} L{rx + 20:.0f},{ry + rh + 22} L{rx - 46:.0f},{ry + rh + 22} L{rx - 22:.0f},{ry + rh / 2 + 22:.0f} Z" fill="#8e0f17" stroke="#0a1e66" stroke-width="5" stroke-linejoin="round"/>
  <path d="M{rx + rw + 46:.0f},{ry + 22} L{rx + rw - 20:.0f},{ry + 22} L{rx + rw - 20:.0f},{ry + rh + 22} L{rx + rw + 46:.0f},{ry + rh + 22} L{rx + rw + 22:.0f},{ry + rh / 2 + 22:.0f} Z" fill="#8e0f17" stroke="#0a1e66" stroke-width="5" stroke-linejoin="round"/>
  <path d="M{rx:.0f},{ry} Q{W / 2:.0f},{ry + 26} {rx + rw:.0f},{ry} L{rx + rw:.0f},{ry + rh} Q{W / 2:.0f},{ry + rh + 26} {rx:.0f},{ry + rh} Z" fill="url(#ribbon)" stroke="#0a1e66" stroke-width="6" stroke-linejoin="round"/>
</g>''')
    # Text leicht gebogen: Zeichen einzeln entlang der Kurve
    cx = (W - sw) / 2
    gl = []
    for ch in sub:
        if ch == ' ':
            cx += fs * 0.28 + trk
            continue
        d, adv = glyph_path(BOLD, ch, fs, x=0, baseline=0)
        mid = cx + adv / 2
        u = (mid - rx) / rw
        yoff = 4 * 13 * u * (1 - u)  # Quadratische Kurve wie das Band
        ang = math.degrees(math.atan2(13 * 4 * (1 - 2 * u), rw)) * 1.0
        gl.append(f'<path d="{d}" transform="translate({cx:.1f},{ry + rh / 2 + fs * 0.36 + yoff:.1f}) rotate({ang:.2f} {adv / 2:.1f} 0)" fill="#ffffff"/>')
        cx += adv + trk
    parts.append('<g>' + ''.join(gl) + '</g>')

    # Funkelsterne
    for (sx, sy, r, c) in [(110, 120, 22, '#ffd23f'), (1180, 150, 18, '#ffffff'), (1110, 540, 16, '#ffd23f'),
                           (150, 560, 14, '#ffffff'), (600, 70, 16, '#ffffff'), (900, 80, 12, '#ffd23f'), (300, 95, 11, '#3fa9ff')]:
        parts.append(star(sx, sy, r, c))

    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 40 {W} 600" width="{W}" height="600">{defs}{"".join(parts)}</svg>'
    return svg


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'logo.svg'
    open(out, 'w').write(build(True))
    open(out.replace('.svg', '-plain.svg'), 'w').write(build(False))
    print('ok', out)


def build_emblem():
    """Kompaktes Emblem: S-Karte mit Narrenkappe (für Kopfzeile, Kartenrückseite, App-Icon)."""
    tw, th = 112, 152
    letter, _ = glyph_path(BLACK, 'S', 100, cx=tw / 2, cy=th / 2 + 4)
    suit, _ = glyph_path(SYM, '♥', 22, cx=21, cy=23)
    suit2, _ = glyph_path(SYM, '♥', 22, cx=tw - 21, cy=th - 23)
    tile = f'''<g transform="translate(40,82) rotate(-7 {tw / 2} {th / 2})">
  <rect x="5" y="9" width="{tw}" height="{th}" rx="16" fill="#0a1e66" opacity=".55"/>
  <rect x="0" y="0" width="{tw}" height="{th}" rx="16" fill="#ffffff" stroke="#0a1e66" stroke-width="6"/>
  <rect x="9" y="9" width="{tw - 18}" height="{th - 18}" rx="10" fill="none" stroke="#ffd23f" stroke-width="3"/>
  <path d="{suit}" fill="#e3262b"/>
  <path d="{suit2}" fill="#e3262b" transform="rotate(180 {tw - 21} {th - 23})"/>
  <path d="{letter}" fill="#e3262b"/>
</g>'''
    hat = f'<g transform="translate(22,6) rotate(-14 70 60) scale(1.45)">{JESTER}</g>'
    stars = star(196, 70, 14, '#ffd23f') + star(26, 200, 10, '#ffffff')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 260" width="220" height="260">{tile}{hat}{stars}</svg>'


if __name__ == '__main__' and len(sys.argv) > 2:
    open(sys.argv[2], 'w').write(build_emblem())
    print('ok', sys.argv[2])
