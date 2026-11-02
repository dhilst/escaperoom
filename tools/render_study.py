"""Render low-poly, PS1-style placeholder images for the Locked Study.

A tiny flat-shaded software renderer: the room and its furniture are boxes and
quads in 3D, projected from two ceiling corners (A and C), drawn back to front,
then darkened by distance, vignetted, and reduced to 15-bit color with ordered
dithering. Output is 320x240, meant to be upscaled with nearest-neighbour.

    python3 tools/render_study.py      # requires Pillow
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

W, H = 320, 240
ROOM = 4.0  # square room, metres
HEIGHT = 2.6
OUT = Path(__file__).resolve().parent.parent / "rooms" / "study"


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def scale(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def norm(a): return scale(a, 1 / math.sqrt(dot(a, a)))


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
            fog = max(0.3, min(1.0, 3.4 / max(depth, 0.1)))
            shaded = tuple(int(c * fog) for c in color)
            draw.polygon([self.cam.project(v) for v in view], fill=shaded, outline=outline)
        return img


def room_shell(s):
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


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def post(img, light_xy, seed):
    """Vignette, a warm light pool, grain, then 15-bit color with ordered dithering."""
    rng = random.Random(seed)
    px = img.load()
    lx, ly = light_xy
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            v = 1.0 - 0.45 * (((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2) / 2
            glow = max(0.0, 1 - math.dist((x, y), (lx, ly)) / 170)
            grain = rng.uniform(-6, 6)
            r = r * v * (0.75 + 0.55 * glow) + grain + 10 * glow
            g = g * v * (0.75 + 0.45 * glow) + grain + 4 * glow
            b = b * v * (0.75 + 0.30 * glow) + grain
            d = (BAYER[y % 4][x % 4] / 16 - 0.5) * 16
            px[x, y] = tuple(max(0, min(255, int((c + d) // 16 * 16))) for c in (r, g, b))
    return img


def main():
    eye = 2.3
    cam_a = Camera((0.35, eye, 0.35), (ROOM - 1.1, 0.95, ROOM))
    cam_c = Camera((ROOM - 0.35, eye, ROOM - 0.35), (1.1, 0.95, 0))

    # Each camera only gets the furniture it faces, so objects that belong to
    # the other viewpoint never poke into the frame edges.
    sa = Scene(cam_a)
    room_shell(sa)
    study_furniture_a(sa)
    post(sa.render(), (150, 110), 1).save(OUT / "camera_a.png")

    sc = Scene(cam_c)
    room_shell(sc)
    study_furniture_c(sc)
    post(sc.render(), (200, 120), 2).save(OUT / "camera_c.png")
    print("wrote", OUT / "camera_a.png", OUT / "camera_c.png")


if __name__ == "__main__":
    main()
