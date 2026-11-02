"""Render low-poly, PS1-style placeholder images for every room.

A tiny flat-shaded software renderer: the room and its furniture are boxes and
quads in 3D, projected from two ceiling corners (A and C), drawn back to front,
then darkened by distance, vignetted, and reduced to 15-bit color with ordered
dithering. Output is 320x240, meant to be upscaled with nearest-neighbour.

    python3 tools/render_rooms.py              # all rooms (requires Pillow)
    python3 tools/render_rooms.py cellar       # just one

Rooms are defined here or in tools/rooms/<id>.py (see load_room_modules).
"""

import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 320, 240
ROOM = 4.0  # square room, metres
HEIGHT = 2.6
ROOMS_DIR = Path(__file__).resolve().parent.parent / "rooms"


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def scale(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def norm(a): return scale(a, 1 / math.sqrt(dot(a, a)))
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


class Camera:
    def __init__(self, pos, target, focal=150):
        self.pos = pos
        self.f = norm(sub(target, pos))
        self.right = norm((self.f[2], 0, -self.f[0]))
        up = (0, 1, 0)
        self.up = norm(sub(up, scale(self.f, dot(up, self.f))))
        self.focal = focal

    def to_view(self, p):
        d = sub(p, self.pos)
        return (dot(d, self.right), dot(d, self.up), dot(d, self.f))

    def project(self, v):
        x, y, z = v
        return (W / 2 + self.focal * x / z, H / 2 - self.focal * y / z)


NEAR = 0.05


def clip_near(poly):
    """Sutherland-Hodgman clip of a view-space polygon against z = NEAR."""
    out = []
    for i, a in enumerate(poly):
        b = poly[(i + 1) % len(poly)]
        a_in, b_in = a[2] >= NEAR, b[2] >= NEAR
        if a_in:
            out.append(a)
        if a_in != b_in:
            t = (NEAR - a[2]) / (b[2] - a[2])
            out.append(tuple(a[k] + (b[k] - a[k]) * t for k in range(3)))
    return out


class Scene:
    def __init__(self, cam):
        self.cam = cam
        self.faces = []  # (depth, points3d, color, outline)

    def quad(self, pts, color, outline=None, bias=0.0):
        center = scale(tuple(map(sum, zip(*pts))), 1 / len(pts))
        depth = math.dist(center, self.cam.pos) - bias
        self.faces.append((depth, pts, color, outline))

    def box(self, x0, x1, y0, y1, z0, z1, color, bias=0.0):
        cx, cy, cz = self.cam.pos
        sides = [
            ((x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1), (-1, 0, 0), x0 - cx > 0, 0.75),
            ((x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1), (1, 0, 0), x1 - cx < 0, 0.75),
            ((x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1), (0, 1, 0), y1 - cy < 0, 1.0),
            ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (0, 0, -1), z0 - cz > 0, 0.6),
            ((x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1), z1 - cz < 0, 0.6),
        ]
        for *pts, _n, visible, light in sides:
            if visible:
                self.quad(pts, tuple(int(c * light) for c in color), bias=bias)

    def beam(self, a, b, w, color, bias=0.0):
        """A square-section rod from a to b (telescope tubes, ladder rails, wires)."""
        d = norm(sub(b, a))
        u = norm(cross(d, (0, 1, 0) if abs(d[1]) < 0.9 else (1, 0, 0)))
        v = cross(d, u)
        h = w / 2
        for n, side in ((u, v), (v, u), (scale(u, -1), v), (scale(v, -1), u)):
            off = scale(n, h)
            pts = [add(add(p, off), scale(side, s * h)) for p, s in ((a, -1), (b, -1), (b, 1), (a, 1))]
            center = add(scale(add(a, b), 0.5), off)
            if dot(n, sub(self.cam.pos, center)) > 0:
                light = 0.6 + 0.4 * max(0.0, n[1]) + 0.15 * abs(n[0])
                self.quad(pts, tuple(int(c * light) for c in color), bias=bias)

    def disc_on_wall(self, center, radius, axis_u, axis_v, color, segments=10, bias=0.0):
        pts = [
            tuple(center[k] + radius * (math.cos(a) * axis_u[k] + math.sin(a) * axis_v[k]) for k in range(3))
            for a in (2 * math.pi * i / segments for i in range(segments))
        ]
        self.quad(pts, color, bias=bias)

    def render(self):
        img = Image.new("RGB", (W, H), (20, 18, 16))
        draw = ImageDraw.Draw(img)
        for depth, pts, color, outline in sorted(self.faces, key=lambda f: -f[0]):
            view = clip_near([self.cam.to_view(p) for p in pts])
            if len(view) < 3:
                continue
            fog = max(0.5, min(1.0, 4.6 / max(depth, 0.1)))
            shaded = tuple(int(c * fog) for c in color)
            draw.polygon([self.cam.project(v) for v in view], fill=shaded, outline=outline)
        return img


def study_shell(s):
    R, Hh = ROOM, HEIGHT
    s.quad([(0, 0, 0), (R, 0, 0), (R, 0, R), (0, 0, R)], (92, 70, 50), bias=-50)  # floor
    s.quad([(0, Hh, 0), (R, Hh, 0), (R, Hh, R), (0, Hh, R)], (52, 50, 46), bias=-50)  # ceiling
    walls = [
        [(0, 0, 0), (R, 0, 0), (R, Hh, 0), (0, Hh, 0)],
        [(0, 0, R), (R, 0, R), (R, Hh, R), (0, Hh, R)],
        [(0, 0, 0), (0, 0, R), (0, Hh, R), (0, Hh, 0)],
        [(R, 0, 0), (R, 0, R), (R, Hh, R), (R, Hh, 0)],
    ]
    for i, w in enumerate(walls):
        s.quad(w, (104, 110, 90) if i % 2 else (82, 90, 74), bias=-40)
    # floorboards: thin dark strips along x
    for k in range(1, 12):
        z = R * k / 12
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.025), (0, 0.001, z + 0.025)], (58, 42, 30), bias=-45)
    # skirting boards
    for w in walls:
        base = [w[0], w[1], (w[1][0], 0.12, w[1][2]), (w[0][0], 0.12, w[0][2])]
        s.quad(base, (50, 36, 26), bias=-39)
    # rug
    s.quad([(1.3, 0.003, 1.2), (2.9, 0.003, 1.2), (2.9, 0.003, 2.6), (1.3, 0.003, 2.6)], (80, 30, 28), bias=-44)
    s.quad([(1.4, 0.004, 1.3), (2.8, 0.004, 1.3), (2.8, 0.004, 2.5), (1.4, 0.004, 2.5)], (100, 46, 36), bias=-43)
    # water stains
    rng = random.Random(7)
    for _ in range(6):
        x, y = rng.uniform(0.3, R - 0.3), rng.uniform(1.4, 2.4)
        r = rng.uniform(0.15, 0.4)
        s.disc_on_wall((x, y, R - 0.002), r, (1, 0, 0), (0, 0.6, 0), (66, 72, 58), 7, bias=-38)
        s.disc_on_wall((R - 0.002, y, x), r, (0, 0, 1), (0, 0.6, 0), (66, 72, 58), 7, bias=-38)
        s.disc_on_wall((x, y, 0.002), r, (1, 0, 0), (0, 0.6, 0), (66, 72, 58), 7, bias=-38)
        s.disc_on_wall((0.002, y, x), r, (0, 0, 1), (0, 0.6, 0), (66, 72, 58), 7, bias=-38)


def study_furniture_a(s):
    """Desk, drawer and clock against the z = ROOM wall."""
    R = ROOM
    wood = (104, 66, 40)
    s.box(1.5, 3.1, 0.74, 0.8, R - 0.75, R, wood)  # desktop
    for lx in (1.55, 3.0):
        s.box(lx, lx + 0.06, 0, 0.74, R - 0.72, R - 0.66, (72, 46, 28))
    s.box(2.35, 3.05, 0.42, 0.74, R - 0.72, R - 0.02, (90, 58, 36))  # drawer pedestal
    zf = R - 0.722
    s.quad([(2.42, 0.47, zf), (2.98, 0.47, zf), (2.98, 0.68, zf), (2.42, 0.68, zf)], (118, 78, 48), bias=1)
    for i in range(4):  # combination dials
        x = 2.52 + i * 0.12
        s.disc_on_wall((x, 0.575, zf - 0.003), 0.035, (1, 0, 0), (0, 1, 0), (170, 150, 90), 6, bias=2)
    # papers and a candle on the desk
    s.box(1.8, 2.15, 0.8, 0.805, R - 0.5, R - 0.25, (178, 170, 140), bias=0.5)
    s.box(2.7, 2.78, 0.8, 0.95, R - 0.35, R - 0.27, (200, 190, 160), bias=0.5)
    # chair
    s.box(2.0, 2.5, 0.42, 0.47, R - 1.3, R - 0.85, (82, 52, 32))
    for lx in (2.02, 2.44):
        for lz in (R - 1.28, R - 0.9):
            s.box(lx, lx + 0.04, 0, 0.42, lz, lz + 0.04, (60, 38, 24))
    s.box(2.0, 2.5, 0.47, 1.0, R - 1.32, R - 1.26, (82, 52, 32))

    # clock above the desk
    c = (2.3, 1.75, R - 0.03)
    s.box(2.0, 2.6, 1.45, 2.05, R - 0.06, R, (70, 50, 34))
    s.disc_on_wall(c, 0.25, (1, 0, 0), (0, 1, 0), (196, 186, 150), 12, bias=1)
    face = R - 0.065
    # minute hand at 3, hour hand a quarter past 3
    s.quad([(c[0], c[1] - 0.012, face), (c[0] + 0.21, c[1] - 0.006, face),
            (c[0] + 0.21, c[1] + 0.006, face), (c[0], c[1] + 0.012, face)], (20, 16, 14), bias=2)
    a = math.radians(-7.5)
    hx, hy = 0.14 * math.cos(a), 0.14 * math.sin(a)
    s.quad([(c[0], c[1] - 0.02, face), (c[0] + hx, c[1] + hy - 0.008, face),
            (c[0] + hx, c[1] + hy + 0.008, face), (c[0], c[1] + 0.02, face)], (20, 16, 14), bias=2.1)
    for i in range(12):
        t = 2 * math.pi * i / 12
        s.disc_on_wall((c[0] + 0.21 * math.cos(t), c[1] + 0.21 * math.sin(t), face), 0.014,
                       (1, 0, 0), (0, 1, 0), (40, 34, 28), 4, bias=1.5)


def study_furniture_c(s):
    """Bookshelf on the z = 0 wall, door on the x = 0 wall."""
    rng = random.Random(3)
    s.box(0.9, 2.5, 0, 2.15, 0, 0.42, (78, 50, 30))
    zf = 0.421
    for i in range(5):
        y0 = 0.08 + i * 0.42
        s.quad([(0.95, y0, zf), (2.45, y0, zf), (2.45, y0 + 0.36, zf), (0.95, y0 + 0.36, zf)], (34, 24, 18), bias=0.5)
        x = 0.97
        while x < 2.4:
            w = rng.uniform(0.04, 0.09)
            if rng.random() < 0.12:
                x += w
                continue
            h = rng.uniform(0.22, 0.34)
            col = rng.choice([(110, 40, 34), (52, 74, 60), (120, 100, 60), (60, 56, 90), (96, 80, 62)])
            s.quad([(x, y0, zf + 0.002), (x + w, y0, zf + 0.002),
                    (x + w, y0 + h, zf + 0.002), (x, y0 + h, zf + 0.002)], col, bias=1)
            x += w + 0.005

    # door on the x = 0 wall
    xf = 0.004
    s.quad([(xf, 0, 1.35), (xf, 0, 2.45), (xf, 2.15, 2.45), (xf, 2.15, 1.35)], (46, 32, 22), bias=0.5)  # frame
    s.quad([(xf + 0.002, 0, 1.42), (xf + 0.002, 0, 2.38), (xf + 0.002, 2.08, 2.38), (xf + 0.002, 2.08, 1.42)],
           (96, 60, 36), bias=1)
    for (y0, y1) in ((0.2, 0.95), (1.15, 1.9)):
        s.quad([(xf + 0.004, y0, 1.55), (xf + 0.004, y0, 2.25), (xf + 0.004, y1, 2.25), (xf + 0.004, y1, 1.55)],
               (78, 48, 28), bias=1.5)
    s.disc_on_wall((xf + 0.006, 1.0, 2.28), 0.035, (0, 0, 1), (0, 1, 0), (196, 160, 70), 6, bias=2)
    s.quad([(xf + 0.006, 0.86, 2.27), (xf + 0.006, 0.86, 2.3), (xf + 0.006, 0.92, 2.3), (xf + 0.006, 0.92, 2.27)],
           (24, 20, 16), bias=2)
    # light under the door
    s.quad([(0.006, 0.001, 1.42), (0.006, 0.001, 2.38), (0.2, 0.001, 2.3), (0.2, 0.001, 1.5)], (110, 120, 130), bias=-44)


EXPOSURE = 1.2
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


WARM = ((0.55, 0.45, 0.30), (10, 4, 0))
COLD = ((0.25, 0.40, 0.35), (0, 6, 4))
MOON = ((0.35, 0.45, 0.75), (4, 8, 22))


def post(img, light_xy, seed, light=WARM):
    """Vignette, a tinted light pool, grain, then 15-bit color with ordered dithering."""
    (mr, mg, mb), (ar, ag, ab) = light
    rng = random.Random(seed)
    px = img.load()
    lx, ly = light_xy
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            v = 1.0 - 0.3 * (((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / 2
            glow = max(0.0, 1 - math.dist((x, y), (lx, ly)) / 170)
            grain = rng.uniform(-6, 6)
            r = r * v * EXPOSURE * (1.0 + mr * glow) + grain + ar * glow
            g = g * v * EXPOSURE * (1.0 + mg * glow) + grain + ag * glow
            b = b * v * EXPOSURE * (1.0 + mb * glow) + grain + ab * glow
            d = (BAYER[y % 4][x % 4] / 16 - 0.5) * 16
            # round to the nearest 4-bit level (the dither supplies the in-between shades)
            px[x, y] = tuple(max(0, min(255, int((c + d + 8) // 16 * 16))) for c in (r, g, b))
    return img




def walls_floor(s, floor, ceiling, wall_dark, wall_light):
    R, Hh = ROOM, HEIGHT
    s.quad([(0, 0, 0), (R, 0, 0), (R, 0, R), (0, 0, R)], floor, bias=-50)
    s.quad([(0, Hh, 0), (R, Hh, 0), (R, Hh, R), (0, Hh, R)], ceiling, bias=-50)
    s.quad([(0, 0, 0), (R, 0, 0), (R, Hh, 0), (0, Hh, 0)], wall_dark, bias=-40)
    s.quad([(0, 0, R), (R, 0, R), (R, Hh, R), (0, Hh, R)], wall_light, bias=-40)
    s.quad([(0, 0, 0), (0, 0, R), (0, Hh, R), (0, Hh, 0)], wall_light, bias=-40)
    s.quad([(R, 0, 0), (R, 0, R), (R, Hh, R), (R, Hh, 0)], wall_dark, bias=-40)


def wall_quad(s, wall, u0, u1, y0, y1, color, inset=0.0, bias=0.0):
    """Axis-aligned rectangle on one of the four walls ('x0', 'xR', 'z0', 'zR'), u running along it."""
    R = ROOM
    if wall == "zR":
        pts = [(u0, y0, R - inset), (u1, y0, R - inset), (u1, y1, R - inset), (u0, y1, R - inset)]
    elif wall == "z0":
        pts = [(u0, y0, inset), (u1, y0, inset), (u1, y1, inset), (u0, y1, inset)]
    elif wall == "xR":
        pts = [(R - inset, y0, u0), (R - inset, y0, u1), (R - inset, y1, u1), (R - inset, y1, u0)]
    else:
        pts = [(inset, y0, u0), (inset, y0, u1), (inset, y1, u1), (inset, y1, u0)]
    s.quad(pts, color, bias=bias)


# --- The Flooded Cellar -------------------------------------------------------

def cellar_shell(s, seed):
    R = ROOM
    walls_floor(s, (64, 66, 62), (34, 36, 34), (70, 74, 72), (84, 88, 84))
    rng = random.Random(seed)
    # irregular stone blocks
    for wall in ("z0", "zR", "x0", "xR"):
        y, row = 0.0, 0
        while y < HEIGHT:
            h = rng.uniform(0.28, 0.4)
            u = -rng.uniform(0, 0.4) if row % 2 else 0.0
            while u < R:
                w = rng.uniform(0.45, 0.8)
                g = rng.randint(-14, 10)
                base = (78 + g, 82 + g, 78 + g) if wall in ("zR", "x0") else (66 + g, 70 + g, 68 + g)
                wall_quad(s, wall, max(u, 0) + 0.02, min(u + w, R) - 0.02, y + 0.02, min(y + h, HEIGHT) - 0.02,
                          base, inset=0.003, bias=-39)
                u += w
            y += h
            row += 1
    # damp concrete with seams
    for k in range(1, 6):
        z = R * k / 6
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], (44, 46, 44), bias=-45)
    # dead bulb hanging from the ceiling
    s.beam((2.0, HEIGHT, 2.0), (2.0, 2.05, 2.0), 0.015, (20, 20, 20))
    s.box(1.96, 2.04, 1.95, 2.05, 1.96, 2.04, (150, 140, 110))


def cellar_a(s):
    """Workbench + toolbox and shelves of jars on the z = ROOM wall, fuse box on x = ROOM."""
    R = ROOM
    rust = (96, 62, 40)
    s.box(1.0, 2.6, 0.82, 0.9, R - 0.7, R, rust)
    for lx in (1.05, 2.5):
        for lz in (R - 0.66, R - 0.1):
            s.box(lx, lx + 0.06, 0, 0.82, lz, lz + 0.06, (60, 44, 34))
    s.box(1.05, 2.55, 0.25, 0.3, R - 0.65, R - 0.05, (70, 50, 38))  # lower shelf
    # toolbox
    s.box(1.75, 2.25, 0.9, 1.1, R - 0.55, R - 0.3, (120, 40, 34), bias=0.5)
    s.box(1.95, 2.05, 1.1, 1.16, R - 0.44, R - 0.41, (60, 60, 60), bias=0.6)
    # tools hanging on the wall
    for i, x in enumerate((1.2, 1.4, 1.55, 2.35)):
        wall_quad(s, "zR", x, x + 0.05, 1.3, 1.75 - 0.1 * (i % 2), (50, 48, 46), inset=0.01, bias=1)
    # shelves of jars
    s.box(2.9, 3.9, 0, 2.0, R - 0.35, R, (62, 46, 34))
    rng = random.Random(11)
    for i in range(4):
        y0 = 0.15 + i * 0.48
        wall_quad(s, "zR", 2.95, 3.85, y0, y0 + 0.42, (26, 22, 20), inset=0.351, bias=0.5)
        x = 3.0
        while x < 3.75:
            w = rng.uniform(0.1, 0.16)
            col = rng.choice([(70, 80, 40), (90, 60, 30), (50, 60, 50), (100, 90, 50)])
            wall_quad(s, "zR", x, x + w, y0, y0 + rng.uniform(0.18, 0.3), col, inset=0.353, bias=1)
            x += w + 0.04
    # fuse box on the x = ROOM wall
    s.box(R - 0.16, R, 1.15, 1.75, 2.5, 3.0, (96, 100, 96))
    wall_quad(s, "xR", 2.58, 2.92, 1.25, 1.65, (60, 64, 60), inset=0.161, bias=1)
    for i in range(3):
        z = 2.63 + i * 0.1
        col = (24, 22, 20) if i == 1 else (150, 130, 80)
        wall_quad(s, "xR", z, z + 0.05, 1.35, 1.55, col, inset=0.163, bias=1.5)
    s.beam((R - 0.05, 1.75, 2.75), (R - 0.05, HEIGHT, 2.75), 0.04, (40, 40, 40))  # conduit


def cellar_c(s):
    """Crates in the water by the z = 0 wall, steel door + keypad on the x = 0 wall."""
    # standing water
    s.quad([(0, 0.004, 0), (3.0, 0.004, 0), (2.6, 0.004, 1.6), (0, 0.004, 2.8)], (22, 28, 30), bias=-44)
    s.quad([(0.4, 0.005, 0.3), (1.6, 0.005, 0.2), (1.2, 0.005, 1.0)], (40, 50, 54), bias=-43)
    plank = (110, 80, 48)
    for (x0, x1, y0, y1, z0, z1) in ((1.0, 1.7, 0, 0.6, 0.05, 0.75), (1.75, 2.4, 0, 0.55, 0.05, 0.7),
                                     (1.2, 1.9, 0.6, 1.15, 0.1, 0.7)):
        s.box(x0, x1, y0, y1, z0, z1, plank)
        for k in (0.33, 0.66):
            y = y0 + (y1 - y0) * k
            s.quad([(x0, y, z1 + 0.003), (x1, y, z1 + 0.003), (x1, y + 0.02, z1 + 0.003), (x0, y + 0.02, z1 + 0.003)],
                   (70, 50, 30), bias=0.5)
    # stencilled lettering on the top crate
    s.quad([(1.35, 0.8, 0.703), (1.75, 0.8, 0.703), (1.75, 0.88, 0.703), (1.35, 0.88, 0.703)], (40, 30, 20), bias=1)
    # red paint marks: unreadable in the dark
    rng = random.Random(5)
    for i in range(4):
        x = 2.65 + i * 0.2
        for _ in range(3):
            y = rng.uniform(1.45, 1.8)
            wall_quad(s, "z0", x + rng.uniform(0, 0.08), x + rng.uniform(0.1, 0.15), y, y + rng.uniform(0.04, 0.1),
                      (70, 24, 22), inset=0.004, bias=0.5)
        wall_quad(s, "z0", x + 0.05, x + 0.07, 1.2, 1.45, (60, 22, 20), inset=0.004, bias=0.5)  # drips
    # steel door
    wall_quad(s, "x0", 1.45, 2.45, 0, 2.1, (40, 42, 44), inset=0.004, bias=0.5)
    wall_quad(s, "x0", 1.5, 2.4, 0, 2.05, (92, 98, 104), inset=0.006, bias=1)
    for y in (0.4, 1.0, 1.6):
        wall_quad(s, "x0", 1.5, 2.4, y, y + 0.04, (70, 74, 80), inset=0.008, bias=1.5)
    for y in (0.3, 1.8):
        s.box(0.006, 0.05, y, y + 0.08, 2.32, 2.4, (60, 62, 66), bias=1.5)  # bolts
    # keypad
    s.box(0.004, 0.06, 1.0, 1.3, 1.15, 1.35, (50, 52, 54), bias=1)
    for r in range(3):
        for c in range(3):
            wall_quad(s, "x0", 1.18 + c * 0.055, 1.22 + c * 0.055, 1.04 + r * 0.06, 1.08 + r * 0.06,
                      (110, 110, 100), inset=0.062, bias=1.5)
    wall_quad(s, "x0", 1.18, 1.32, 1.23, 1.27, (14, 20, 14), inset=0.062, bias=1.5)  # dead display


# --- The Observatory ----------------------------------------------------------

def observatory_shell(s, seed):
    R = ROOM
    walls_floor(s, (92, 70, 52), (46, 40, 36), (78, 66, 60), (96, 82, 70))
    rng = random.Random(seed)
    for wall in ("z0", "zR", "x0", "xR"):  # vertical planks
        u = 0.0
        while u < R:
            w = rng.uniform(0.18, 0.26)
            wall_quad(s, wall, u, u + 0.015, 0, HEIGHT, (40, 32, 28), inset=0.002, bias=-39)
            u += w
    for k in range(1, 14):
        z = R * k / 14
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], (52, 38, 28), bias=-45)
    for k in range(1, 6):  # rafters
        x = R * k / 6
        s.box(x - 0.06, x + 0.06, HEIGHT - 0.14, HEIGHT, 0, R, (56, 42, 32), bias=-30)


def observatory_a(s):
    """Telescope, star chart on the z = ROOM wall, birdcage hanging near x = ROOM."""
    R = ROOM
    # gap in the roof boards over the telescope, full of stars
    s.quad([(2.3, HEIGHT - 0.001, 3.0), (3.2, HEIGHT - 0.001, 3.0), (3.2, HEIGHT - 0.001, 3.6), (2.3, HEIGHT - 0.001, 3.6)],
           (14, 18, 40), bias=-20)
    rng = random.Random(9)
    for _ in range(8):
        x, z = rng.uniform(2.35, 3.15), rng.uniform(3.05, 3.55)
        s.quad([(x, HEIGHT - 0.002, z), (x + 0.025, HEIGHT - 0.002, z), (x + 0.025, HEIGHT - 0.002, z + 0.025),
                (x, HEIGHT - 0.002, z + 0.025)], (200, 200, 220), bias=-19)
    # star chart
    wall_quad(s, "zR", 0.9, 1.9, 1.15, 1.95, (60, 44, 30), inset=0.004, bias=0.5)
    wall_quad(s, "zR", 0.95, 1.85, 1.2, 1.9, (176, 160, 120), inset=0.006, bias=1)
    swan = [(1.4, 1.75), (1.4, 1.6), (1.4, 1.45), (1.25, 1.58), (1.55, 1.62), (1.4, 1.32)]
    for i, (x, y) in enumerate(swan):
        s.disc_on_wall((x, y, R - 0.008), 0.018, (1, 0, 0), (0, 1, 0), (40, 34, 60), 5, bias=1.5)
        if i < len(swan) - 1 and i != 2:
            nx, ny = swan[i + 1]
            s.beam((x, y, R - 0.01), (nx, ny, R - 0.01), 0.006, (90, 80, 70), bias=1.4)
    for _ in range(14):
        x, y = rng.uniform(1.0, 1.8), rng.uniform(1.25, 1.85)
        s.disc_on_wall((x, y, R - 0.008), 0.008, (1, 0, 0), (0, 1, 0), (70, 60, 50), 4, bias=1.3)
    # telescope on a tripod
    top = (2.6, 1.05, 3.1)
    for foot in ((2.3, 0, 2.8), (2.95, 0, 2.85), (2.6, 0, 3.5)):
        s.beam(foot, top, 0.035, (60, 44, 30))
    s.beam((2.45, 0.92, 2.85), (2.85, 1.5, 3.45), 0.12, (170, 130, 60), bias=0.3)
    s.beam((2.85, 1.5, 3.45), (2.92, 1.6, 3.55), 0.15, (140, 104, 48), bias=0.4)
    s.beam((2.38, 0.83, 2.76), (2.45, 0.92, 2.85), 0.06, (50, 40, 30), bias=0.4)
    # birdcage hanging on a chain near the x = ROOM wall
    cx, cz, y0, y1 = 3.45, 2.3, 1.25, 1.7
    s.beam((cx, HEIGHT, cz), (cx, y1 + 0.12, cz), 0.015, (40, 36, 30))
    s.box(cx - 0.2, cx + 0.2, y0 - 0.03, y0, cz - 0.2, cz + 0.2, (70, 60, 44))
    for i in range(10):
        t = 2 * math.pi * i / 10
        bx, bz = cx + 0.19 * math.cos(t), cz + 0.19 * math.sin(t)
        s.beam((bx, y0, bz), (bx, y1, bz), 0.012, (120, 104, 70), bias=0.2)
        s.beam((bx, y1, bz), (cx, y1 + 0.12, cz), 0.012, (120, 104, 70), bias=0.2)
    s.box(cx - 0.12, cx + 0.04, y0, y0 + 0.03, cz - 0.08, cz + 0.06, (150, 140, 120), bias=0.3)  # feathers


def observatory_c(s):
    """Music box on a table and round window on the z = 0 wall, ladder + hatch on x = 0."""
    # round window with stars
    wc = (2.9, 1.55, 0.004)
    s.disc_on_wall(wc, 0.42, (1, 0, 0), (0, 1, 0), (56, 44, 34), 14, bias=0.5)
    s.disc_on_wall((wc[0], wc[1], 0.006), 0.36, (1, 0, 0), (0, 1, 0), (18, 24, 54), 14, bias=1)
    s.beam((wc[0] - 0.36, wc[1], 0.01), (wc[0] + 0.36, wc[1], 0.01), 0.03, (56, 44, 34), bias=1.5)
    s.beam((wc[0], wc[1] - 0.36, 0.01), (wc[0], wc[1] + 0.36, 0.01), 0.03, (56, 44, 34), bias=1.5)
    rng = random.Random(4)
    for _ in range(10):
        a, r = rng.uniform(0, 2 * math.pi), rng.uniform(0.05, 0.32)
        s.disc_on_wall((wc[0] + r * math.cos(a), wc[1] + r * math.sin(a), 0.008), 0.012,
                       (1, 0, 0), (0, 1, 0), (210, 210, 230), 4, bias=1.2)
    # moonlight on the floor
    s.quad([(2.5, 0.003, 0.4), (3.3, 0.003, 0.4), (3.5, 0.003, 1.3), (2.3, 0.003, 1.3)], (98, 96, 110), bias=-44)
    # table and music box
    s.box(1.4, 2.2, 0.68, 0.74, 0.05, 0.65, (90, 60, 40))
    for lx in (1.45, 2.11):
        for lz in (0.1, 0.56):
            s.box(lx, lx + 0.04, 0, 0.68, lz, lz + 0.04, (64, 42, 28))
    s.box(1.62, 1.98, 0.74, 0.92, 0.2, 0.48, (110, 30, 36), bias=0.5)
    s.box(1.6, 2.0, 0.92, 0.95, 0.18, 0.5, (170, 140, 70), bias=0.6)
    s.box(1.98, 2.04, 0.8, 0.84, 0.32, 0.36, (40, 30, 24), bias=0.7)  # empty crank socket
    # ladder against the x = 0 wall up to the hatch
    for z in (1.7, 2.15):
        s.beam((0.25, 0, z), (0.05, HEIGHT, z), 0.05, (110, 84, 56))
    for k in range(1, 9):
        y = HEIGHT * k / 9
        x = 0.25 - 0.2 * y / HEIGHT
        s.beam((x, y, 1.7), (x, y, 2.15), 0.035, (100, 76, 50), bias=0.2)
    # hatch in the ceiling with a padlock
    s.quad([(0.0, HEIGHT - 0.003, 1.55), (0.75, HEIGHT - 0.003, 1.55), (0.75, HEIGHT - 0.003, 2.3),
            (0.0, HEIGHT - 0.003, 2.3)], (70, 50, 34), bias=-10)
    s.quad([(0.05, HEIGHT - 0.005, 1.6), (0.7, HEIGHT - 0.005, 1.6), (0.7, HEIGHT - 0.005, 2.25),
            (0.05, HEIGHT - 0.005, 2.25)], (100, 72, 46), bias=-9)
    s.box(0.6, 0.7, HEIGHT - 0.14, HEIGHT - 0.005, 1.88, 1.98, (170, 150, 80), bias=1)


# --- Scenes --------------------------------------------------------------------

def render_room(room_id, a_parts, c_parts, light_a, light_c, light):
    eye = 2.3
    cam_a = Camera((0.35, eye, 0.35), (ROOM - 1.1, 0.95, ROOM))
    cam_c = Camera((ROOM - 0.35, eye, ROOM - 0.35), (1.1, 0.95, 0))
    out = ROOMS_DIR / room_id
    # Each camera only gets the furniture it faces, so objects that belong to
    # the other viewpoint never poke into the frame edges.
    for name, cam, parts, glow, seed in (("camera_a.png", cam_a, a_parts, light_a, 1),
                                          ("camera_c.png", cam_c, c_parts, light_c, 2)):
        scene = Scene(cam)
        for part in parts:
            part(scene)
        post(scene.render(), glow, seed, light).save(out / name)
        print("wrote", out / name)


ROOMS = {
    "study": lambda: render_room("study", [study_shell, study_furniture_a], [study_shell, study_furniture_c],
                                 (150, 110), (200, 120), WARM),
    "cellar": lambda: render_room("cellar", [lambda s: cellar_shell(s, 21), cellar_a],
                                  [lambda s: cellar_shell(s, 21), cellar_c], (160, 70), (160, 70), COLD),
    "observatory": lambda: render_room("observatory", [lambda s: observatory_shell(s, 8), observatory_a],
                                       [lambda s: observatory_shell(s, 8), observatory_c], (220, 60), (110, 90), MOON),
}


def load_room_modules():
    """Rooms can also live in tools/rooms/<id>.py. Such a module does
    `import render_rooms as rr`, builds its scene with rr's helpers, and defines

        ROOM = dict(a=[parts...], c=[parts...], light_a=(x, y), light_c=(x, y), light=rr.WARM)

    where each part is a function taking the Scene. The file name is the room id."""
    import importlib.util
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    for path in sorted((Path(__file__).resolve().parent / "rooms").glob("*.py")):
        spec = importlib.util.spec_from_file_location(f"room_{path.stem}", path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        r = module.ROOM
        ROOMS[path.stem] = (lambda rid, r: lambda: render_room(
            rid, r["a"], r["c"], r["light_a"], r["light_c"], r["light"]))(path.stem, r)


if __name__ == "__main__":
    load_room_modules()
    for room_id in sys.argv[1:] or ROOMS:
        ROOMS[room_id]()
