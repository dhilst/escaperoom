"""The Music Room: grand piano with sheet music, curtained window and candelabra (A);
gramophone, cello, cello case and the oak panelling with its carved lyre (C)."""

import math
import random

import render_rooms as rr

R, H = rr.ROOM, rr.HEIGHT
OAK, OAK_DARK, OAK_LIGHT = (92, 62, 38), (60, 40, 26), (120, 84, 52)
BRASS = (196, 156, 70)
EBONY, EBONY_EDGE = (40, 38, 46), (78, 76, 88)
VELVET, VELVET_DARK = (120, 34, 44), (88, 24, 34)


def shell(s):
    """Green damask wallpaper over an oak wainscot, parquet floor and a rug."""
    rr.walls_floor(s, (96, 66, 42), (44, 40, 36), (54, 76, 62), (64, 90, 72))
    rng = random.Random(12)
    for wall in ("z0", "zR", "x0", "xR"):
        rr.wall_quad(s, wall, 0, R, 0, 0.95, OAK, inset=0.002, bias=-39)
        rr.wall_quad(s, wall, 0, R, 0.92, 0.98, OAK_LIGHT, inset=0.003, bias=-38.5)
        u = 0.1
        while u < R - 0.2:  # sunken wainscot panels
            rr.wall_quad(s, wall, u, u + 0.6, 0.12, 0.8, OAK_DARK, inset=0.003, bias=-38.6)
            rr.wall_quad(s, wall, u + 0.04, u + 0.56, 0.16, 0.76, (100, 68, 42), inset=0.004, bias=-38.4)
            u += 0.7
        for _ in range(14):  # damask motifs
            u, y = rng.uniform(0.2, R - 0.2), rng.uniform(1.15, 2.4)
            c = {"zR": (u, y, R - 0.003), "z0": (u, y, 0.003), "xR": (R - 0.003, y, u), "x0": (0.003, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, 0.07, axis, (0, 1.6, 0), (78, 104, 82), 4, bias=-38)
        rr.wall_quad(s, wall, 0, R, H - 0.1, H, (130, 116, 90), inset=0.003, bias=-38.5)  # cornice
    # herringbone-ish parquet: alternating strips
    for k in range(16):
        z = R * k / 16
        col = (106, 74, 46) if k % 2 else (90, 62, 40)
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + R / 16), (0, 0.001, z + R / 16)], col, bias=-46)
    # a faded red rug in the middle
    s.quad([(1.0, 0.003, 1.0), (3.0, 0.003, 1.0), (3.0, 0.003, 3.0), (1.0, 0.003, 3.0)], (96, 36, 40), bias=-44)
    s.quad([(1.12, 0.004, 1.12), (2.88, 0.004, 1.12), (2.88, 0.004, 2.88), (1.12, 0.004, 2.88)], (120, 56, 52), bias=-43)


def piano(s):
    """A black grand piano, keyboard towards camera A, lid propped up; one white key missing."""
    zk = 2.45  # front of the case
    # legs
    for x, z in ((1.42, zk + 0.08), (2.65, zk + 0.08), (1.6, 3.62)):
        s.box(x - 0.06, x + 0.06, 0, 0.62, z - 0.06, z + 0.06, EBONY)
    # the case: wide at the keyboard, tapering towards the tail
    s.box(1.3, 2.8, 0.62, 0.95, zk, 3.1, EBONY)
    s.box(1.3, 2.45, 0.62, 0.95, 3.1, 3.55, EBONY)
    s.box(1.3, 1.95, 0.62, 0.95, 3.55, 3.8, EBONY)
    s.box(1.28, 2.82, 0.93, 0.96, zk - 0.02, 3.12, EBONY_EDGE, bias=0.1)  # rim
    # strings and gold frame visible under the open lid
    s.quad([(1.38, 0.962, zk + 0.35), (2.72, 0.962, zk + 0.35), (2.38, 0.962, 3.5), (1.38, 0.962, 3.72)],
           (170, 136, 64), bias=0.3)
    for k in range(9):
        x = 1.45 + k * 0.12
        s.quad([(x, 0.966, zk + 0.38), (x + 0.015, 0.966, zk + 0.38), (x + 0.015, 0.966, 3.5 + 0.02 * (8 - k) - 0.1),
                (x, 0.966, 3.5 + 0.02 * (8 - k) - 0.1)], (220, 210, 170), bias=0.4)
    # the lid, hinged on the left edge and propped up on the right
    s.quad([(1.3, 0.97, zk + 0.3), (1.3, 0.97, 3.8), (1.95, 1.75, 3.7), (2.6, 1.75, zk + 0.4)], (58, 56, 66), bias=0.2)
    s.beam((2.6, 0.96, zk + 0.75), (2.42, 1.53, zk + 0.75), 0.03, EBONY_EDGE, bias=0.5)  # prop stick
    # key bed sticking out towards the player
    s.box(1.3, 2.8, 0.66, 0.76, zk - 0.3, zk, EBONY)
    s.box(1.3, 1.36, 0.76, 0.86, zk - 0.3, zk, EBONY)  # cheek blocks
    s.box(2.74, 2.8, 0.76, 0.86, zk - 0.3, zk, EBONY)
    n, x0, x1 = 21, 1.38, 2.72
    w = (x1 - x0) / n
    gap = 11
    for i in range(n):
        xa = x0 + i * w
        col = (24, 20, 20) if i == gap else (226, 220, 200)
        s.quad([(xa + 0.004, 0.762, zk - 0.27), (xa + w - 0.004, 0.762, zk - 0.27),
                (xa + w - 0.004, 0.762, zk - 0.02), (xa + 0.004, 0.762, zk - 0.02)], col, bias=0.6)
    for i in range(n - 1):
        if i % 7 in (2, 6):
            continue
        xa = x0 + (i + 1) * w
        s.box(xa - w * 0.3, xa + w * 0.3, 0.762, 0.8, zk - 0.12, zk - 0.02, (20, 18, 22), bias=0.8)
    # music stand with the sheet music, leaning back from the keyboard
    s.quad([(1.55, 0.96, zk + 0.1), (2.55, 0.96, zk + 0.1), (2.55, 1.32, zk + 0.22), (1.55, 1.32, zk + 0.22)],
           EBONY_EDGE, bias=0.8)
    for xa, col in ((1.62, (226, 218, 190)), (2.06, (236, 228, 200))):
        s.quad([(xa, 0.99, zk + 0.09), (xa + 0.42, 0.99, zk + 0.09), (xa + 0.42, 1.3, zk + 0.2), (xa, 1.3, zk + 0.2)],
               col, bias=1)
        for k in range(4):  # staves
            t = 0.2 + k * 0.2
            ya, za = 0.99 + 0.31 * t, zk + 0.09 + 0.11 * t
            s.quad([(xa + 0.03, ya, za - 0.002), (xa + 0.39, ya, za - 0.002), (xa + 0.39, ya + 0.02, za + 0.005),
                    (xa + 0.03, ya + 0.02, za + 0.005)], (90, 84, 80), bias=1.2)

    # bench
    for x in (1.72, 2.38):
        for z in (1.78, 2.02):
            s.box(x - 0.03, x + 0.03, 0, 0.46, z - 0.03, z + 0.03, EBONY)
    s.box(1.66, 2.44, 0.46, 0.54, 1.72, 2.08, EBONY)
    s.box(1.7, 2.4, 0.54, 0.57, 1.75, 2.05, VELVET, bias=0.3)


def window_and_curtains(s):
    """Tall window on the x = R wall, velvet curtains drawn tight, a thread of moonlight."""
    z0, z1 = 1.1, 2.7
    rr.wall_quad(s, "xR", z0 - 0.1, z1 + 0.1, 0.55, 2.42, (40, 46, 70), inset=0.004, bias=0.3)  # window recess
    for k in range(10):  # folds
        za = z0 + k * (z1 - z0) / 10
        col = VELVET if k % 2 else VELVET_DARK
        rr.wall_quad(s, "xR", za, za + (z1 - z0) / 10 + 0.002, 0.08, 2.3, col, inset=0.06, bias=0.6)
    s.box(R - 0.14, R, 2.28, 2.45, z0 - 0.18, z1 + 0.18, OAK_LIGHT, bias=0.8)  # pelmet
    for z in (z0 + 0.25, z1 - 0.25):  # gold tie tassels
        rr.wall_quad(s, "xR", z - 0.03, z + 0.03, 1.1, 1.3, BRASS, inset=0.064, bias=0.9)
    # moonlight leaking under the hem and across the floor
    zc = (z0 + z1) / 2
    rr.wall_quad(s, "xR", zc - 0.02, zc + 0.02, 0.08, 2.28, (150, 170, 210), inset=0.062, bias=0.7)
    s.quad([(R - 0.06, 0.004, zc - 0.05), (R - 0.06, 0.004, zc + 0.05), (R - 1.4, 0.004, zc + 0.3),
            (R - 1.4, 0.004, zc + 0.1)], (130, 140, 170), bias=-42)


def candelabra(s):
    """A silver candelabra with burnt-down stubs on a pedestal in the corner."""
    x, z = 3.45, 3.5
    s.box(x - 0.16, x + 0.16, 0, 0.06, z - 0.16, z + 0.16, OAK_DARK)
    s.box(x - 0.08, x + 0.08, 0.06, 0.95, z - 0.08, z + 0.08, OAK)
    s.box(x - 0.2, x + 0.2, 0.95, 1.0, z - 0.2, z + 0.2, OAK_LIGHT)
    silver = (176, 176, 184)
    s.box(x - 0.08, x + 0.08, 1.0, 1.04, z - 0.08, z + 0.08, silver, bias=0.3)
    s.beam((x, 1.04, z), (x, 1.42, z), 0.035, silver, bias=0.3)
    for dx in (-0.2, 0.2):
        s.beam((x, 1.3, z), (x + dx, 1.36, z), 0.025, silver, bias=0.35)
        s.beam((x + dx, 1.36, z), (x + dx, 1.44, z), 0.025, silver, bias=0.35)
    for dx in (-0.2, 0.0, 0.2):
        top = 1.5 if dx else 1.54
        s.box(x + dx - 0.035, x + dx + 0.035, top - 0.08, top, z - 0.035, z + 0.035, (210, 200, 170), bias=0.5)
        s.box(x + dx - 0.05, x + dx + 0.05, top - 0.1, top - 0.08, z - 0.05, z + 0.05, silver, bias=0.45)


def music_a(s):
    piano(s)
    window_and_curtains(s)
    candelabra(s)


def ring(s, center, axis, radius, color, segments=12, bias=0.0):
    a = rr.norm(axis)
    u = rr.norm(rr.cross(a, (0, 1, 0) if abs(a[1]) < 0.9 else (1, 0, 0)))
    v = rr.cross(u, a)
    s.disc_on_wall(center, radius, u, v, color, segments, bias=bias)


def gramophone(s):
    """A gramophone on a small cabinet against z = 0, its brass horn turned towards the room."""
    x0, x1 = 0.55, 1.35
    s.box(x0, x1, 0, 0.82, 0.05, 0.6, OAK)
    rr.wall_quad(s, "z0", x0 + 0.06, x1 - 0.06, 0.1, 0.7, OAK_DARK, inset=0.602, bias=0.5)
    s.box(x0 + 0.1, x1 - 0.1, 0.82, 0.98, 0.1, 0.55, (80, 50, 30))  # the machine box
    s.box(x0 + 0.12, x1 - 0.12, 0.98, 1.0, 0.12, 0.53, (40, 36, 34), bias=0.3)  # turntable felt
    ring(s, (0.95, 1.005, 0.33), (0, 1, 0), 0.17, (24, 22, 24), 12, bias=0.5)  # cracked record
    ring(s, (0.95, 1.008, 0.33), (0, 1, 0), 0.05, (170, 60, 50), 8, bias=0.6)
    s.beam((1.08, 1.0, 0.18), (1.08, 1.28, 0.18), 0.04, BRASS, bias=0.6)  # horn elbow
    # the horn: a cone of quads widening from the elbow towards the room
    horn(s, (1.08, 1.28, 0.18), (0.95, 0.55, 0.1), 0.8)


def horn(s, base, axis, length, segments=12, steps=7):
    a = rr.norm(axis)
    u = rr.norm(rr.cross(a, (0, 1, 0)))
    v = rr.cross(u, a)
    radius = lambda t: 0.03 + 0.3 * t ** 2.2
    def at(t, k):
        ang = 2 * math.pi * k / segments
        c = rr.add(base, rr.scale(a, length * t))
        off = rr.add(rr.scale(u, math.cos(ang) * radius(t)), rr.scale(v, math.sin(ang) * radius(t)))
        return rr.add(c, off), rr.norm(off)
    for i in range(steps):
        t0, t1 = i / steps, (i + 1) / steps
        for k in range(segments):
            p00, n0 = at(t0, k)
            p01, _ = at(t0, k + 1)
            p11, _ = at(t1, k + 1)
            p10, n1 = at(t1, k)
            mid = rr.scale(rr.add(p00, p11), 0.5)
            n = rr.norm(rr.add(n0, n1))
            if rr.dot(n, rr.sub(s.cam.pos, mid)) <= 0:
                continue
            light = 0.65 + 0.35 * max(0.0, n[1]) + 0.2 * (k % 2)
            col = tuple(min(255, int(c * light)) for c in BRASS)
            s.quad([p00, p01, p11, p10], col, bias=1.0)
    mouth = rr.add(base, rr.scale(a, length * 0.99))
    s.disc_on_wall(mouth, radius(1) * 0.92, u, v, (70, 48, 20), segments, bias=0.9)  # the dark throat
    s.disc_on_wall(rr.add(base, rr.scale(a, length * 0.9)), 0.05, u, v, (210, 200, 170), 8, bias=0.95)


def cello(s):
    """A cello on a stand, its bow missing, and a black case leaning on the wall."""
    x, z = 2.2, 0.45
    wood, dark = (160, 82, 38), (110, 52, 24)
    s.box(x - 0.24, x + 0.24, 0.12, 0.2, z - 0.18, z + 0.18, (50, 36, 26))  # stand
    s.beam((x, 0.0, z), (x, 0.14, z), 0.03, (40, 36, 34))  # endpin
    s.box(x - 0.27, x + 0.27, 0.14, 0.62, z - 0.09, z + 0.09, wood)  # lower bout
    s.box(x - 0.17, x + 0.17, 0.62, 0.72, z - 0.09, z + 0.09, wood)  # waist
    s.box(x - 0.23, x + 0.23, 0.72, 1.06, z - 0.09, z + 0.09, wood)  # upper bout
    for dx in (-0.09, 0.09):  # f-holes
        s.box(x + dx - 0.012, x + dx + 0.012, 0.5, 0.78, z + 0.09, z + 0.095, (20, 12, 8), bias=0.6)
    s.box(x - 0.05, x + 0.05, 0.3, 0.36, z + 0.09, z + 0.13, dark, bias=0.6)  # bridge... tailpiece
    s.box(x - 0.04, x + 0.04, 1.06, 1.62, z - 0.04, z + 0.06, (30, 26, 24))  # neck + fingerboard
    s.box(x - 0.05, x + 0.05, 1.62, 1.76, z - 0.05, z + 0.05, dark)  # pegbox
    ring(s, (x, 1.8, z), (1, 0, 0), 0.05, dark, 8, bias=0.4)  # scroll
    for dx in (-0.025, 0.025):
        s.beam((x + dx, 0.36, z + 0.1), (x + dx, 1.6, z + 0.07), 0.004, (150, 140, 120), bias=0.8)

    # the case: a cello-shaped shell standing against the wall
    cx, black, side = 3.15, (40, 38, 42), (28, 26, 30)
    widths = [(0.0, 0.2), (0.12, 0.29), (0.55, 0.3), (0.72, 0.23), (0.98, 0.25), (1.12, 0.17), (1.5, 0.09), (1.62, 0.05)]
    zf, zb = 0.3, 0.03
    outline = [(cx + w, y) for y, w in widths] + [(cx - w, y) for y, w in reversed(widths)]
    s.quad([(x_, y_, zf) for x_, y_ in outline], black, bias=0.4)
    for (xa, ya), (xb, yb) in zip(outline, outline[1:] + outline[:1]):
        s.quad([(xa, ya, zb), (xb, yb, zb), (xb, yb, zf), (xa, ya, zf)], side, bias=0.3)
    s.box(cx - 0.05, cx + 0.05, 0.62, 0.66, zf, zf + 0.04, BRASS, bias=0.6)  # latch
    s.box(cx - 0.05, cx + 0.05, 1.05, 1.09, zf, zf + 0.04, BRASS, bias=0.6)
    s.box(cx + 0.24, cx + 0.3, 0.78, 0.9, zf - 0.08, zf - 0.02, (90, 70, 50), bias=0.6)  # handle


def panelling(s):
    """The x = 0 wall is panelled to the ceiling; one tall panel carves a lyre."""
    for k in range(5):
        u0 = 0.15 + k * 0.76
        rr.wall_quad(s, "x0", u0, u0 + 0.66, 1.05, H - 0.16, OAK_DARK, inset=0.004, bias=-37)
        rr.wall_quad(s, "x0", u0 + 0.05, u0 + 0.61, 1.1, H - 0.21, OAK, inset=0.005, bias=-36.8)
    # the lyre panel, floor to cornice
    z0, z1 = 1.55, 2.45
    rr.wall_quad(s, "x0", z0 - 0.06, z1 + 0.06, 0.05, 2.3, (40, 28, 18), inset=0.006, bias=0.4)
    rr.wall_quad(s, "x0", z0, z1, 0.08, 2.26, (100, 68, 42), inset=0.008, bias=0.5)
    rr.wall_quad(s, "x0", z0 + 0.06, z1 - 0.06, 0.14, 2.2, (84, 56, 34), inset=0.01, bias=0.6)
    zc, x = (z0 + z1) / 2, 0.014
    carve = (150, 112, 62)
    pts = []
    for i in range(9):  # one arm of the lyre, curving out then in
        t = i / 8
        pts.append((0.14 + 0.2 * math.sin(math.pi * t) + 0.02 * t, 0.7 + 0.85 * t))
    for side in (-1, 1):
        for (w0, y0), (w1, y1) in zip(pts, pts[1:]):
            s.beam((x, y0, zc + side * w0), (x, y1, zc + side * w1), 0.035, carve, bias=0.9)
    s.beam((x, 1.55, zc - 0.17), (x, 1.55, zc + 0.17), 0.04, carve, bias=0.95)  # crossbar
    s.beam((x, 0.68, zc - 0.17), (x, 0.68, zc + 0.17), 0.05, carve, bias=0.95)  # base
    for k in range(5):  # strings
        dz = -0.1 + k * 0.05
        s.beam((x, 0.7, zc + dz), (x, 1.53, zc + dz), 0.008, (200, 180, 120), bias=1.0)


def music_c(s):
    gramophone(s)
    cello(s)
    panelling(s)


ROOM = dict(a=[shell, music_a], c=[shell, music_c], light_a=(270, 110), light_c=(120, 110), light=rr.MOON)
