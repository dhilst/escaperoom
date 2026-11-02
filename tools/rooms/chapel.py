"""The Chapel: altar with three candles under a stained-glass window (A),
red sanctuary lamp, lectern with hymnal and a confessional (C)."""

import math
import random

import render_rooms as rr

R, H = rr.ROOM, rr.HEIGHT
# Candlelight tinted by the red sanctuary lamp.
EMBER = ((0.60, 0.32, 0.22), (16, 2, 0))


def shell(s):
    rr.walls_floor(s, (78, 74, 70), (40, 38, 40), (76, 74, 78), (92, 90, 94))
    rng = random.Random(17)
    for wall in ("z0", "zR", "x0", "xR"):  # ashlar blocks
        y, row = 0.0, 0
        while y < H:
            h = 0.32
            u = -0.3 if row % 2 else 0.0
            while u < R:
                w = rng.uniform(0.55, 0.75)
                g = rng.randint(-10, 8)
                base = (90 + g, 88 + g, 92 + g) if wall in ("zR", "x0") else (74 + g, 72 + g, 76 + g)
                rr.wall_quad(s, wall, max(u, 0) + 0.02, min(u + w, R) - 0.02, y + 0.02, min(y + h, H) - 0.02,
                             base, inset=0.003, bias=-39)
                u += w
            y += h
            row += 1
    # flagstone floor
    for k in range(1, 6):
        t = R * k / 6
        s.quad([(0, 0.001, t), (R, 0.001, t), (R, 0.001, t + 0.025), (0, 0.001, t + 0.025)], (50, 48, 46), bias=-45)
        s.quad([(t, 0.001, 0), (t + 0.025, 0.001, 0), (t + 0.025, 0.001, R), (t, 0.001, R)], (50, 48, 46), bias=-45)
    # vaulting ribs across the ceiling
    for k in (1, 2, 3):
        x = R * k / 4
        s.box(x - 0.05, x + 0.05, H - 0.12, H, 0, R, (60, 56, 56), bias=-30)


def candle(s, x, z, color, top):
    s.box(x - 0.055, x + 0.055, 1.02, top, z - 0.055, z + 0.055, color, bias=0.6)
    s.box(x - 0.01, x + 0.01, top, top + 0.04, z - 0.01, z + 0.01, (30, 26, 22), bias=0.7)  # cold wick
    s.box(x - 0.09, x + 0.09, 1.0, 1.04, z - 0.09, z + 0.09, (150, 120, 60), bias=0.5)  # brass holder


def chapel_a(s):
    """Altar, candles and candle box against z = R; stained glass above; a narrow window on x = R."""
    # carpet runner up to the altar
    s.quad([(1.95, 0.003, 1.6), (2.85, 0.003, 1.6), (2.85, 0.003, R - 0.6), (1.95, 0.003, R - 0.6)], (90, 26, 26), bias=-44)
    # step and altar
    s.box(1.4, 3.4, 0, 0.12, R - 1.0, R, (98, 94, 96))
    s.box(1.6, 3.2, 0.12, 1.0, R - 0.75, R - 0.15, (124, 120, 120))
    s.box(1.55, 3.25, 0.96, 1.02, R - 0.8, R - 0.1, (140, 136, 134), bias=0.2)  # mensa
    # white altar cloth hanging over the front
    rr.wall_quad(s, "zR", 1.75, 3.05, 0.6, 1.02, (178, 168, 140), inset=0.802, bias=0.4)
    rr.wall_quad(s, "zR", 2.3, 2.5, 0.6, 1.0, (130, 30, 30), inset=0.805, bias=0.45)  # red band
    # three tall candles: black, white, red (left to right)
    z = R - 0.45
    candle(s, 1.95, z, (28, 26, 30), 1.6)
    candle(s, 2.4, z, (226, 222, 206), 1.6)
    candle(s, 2.85, z, (170, 30, 30), 1.6)
    # small tin candle box at the front right corner of the altar
    s.box(2.95, 3.22, 1.02, 1.2, R - 0.75, R - 0.5, (120, 116, 100), bias=0.6)
    s.box(2.93, 3.24, 1.2, 1.24, R - 0.77, R - 0.48, (160, 150, 120), bias=0.65)

    # stained-glass window above the altar: pointed arch in lead-grey frame
    cx, y0, y1, half = 2.4, 1.72, 2.3, 0.5
    rr.wall_quad(s, "zR", cx - half - 0.06, cx + half + 0.06, y0 - 0.06, y1, (44, 40, 44), inset=0.004, bias=0.5)
    s.quad([(cx - half - 0.06, y1, R - 0.004), (cx + half + 0.06, y1, R - 0.004), (cx, y1 + 0.28, R - 0.004)],
           (44, 40, 44), bias=0.5)
    panes = [(40, 60, 150), (150, 30, 40), (60, 120, 70), (190, 160, 60), (90, 50, 130)]
    rng = random.Random(5)
    cols = 4
    for i in range(cols):
        for j in range(4):
            u0 = cx - half + i * (2 * half / cols)
            v0 = y0 + j * (y1 - y0) / 4
            rr.wall_quad(s, "zR", u0 + 0.02, u0 + 2 * half / cols - 0.02, v0 + 0.02, v0 + (y1 - y0) / 4 - 0.02,
                         rng.choice(panes), inset=0.006, bias=1)
    s.quad([(cx - half + 0.02, y1 + 0.02, R - 0.006), (cx + half - 0.02, y1 + 0.02, R - 0.006),
            (cx, y1 + 0.23, R - 0.006)], (190, 160, 60), bias=1)
    # the saint: a pale figure holding up a candle
    rr.wall_quad(s, "zR", cx - 0.09, cx + 0.09, y0 + 0.05, y0 + 0.4, (200, 196, 180), inset=0.008, bias=1.5)
    s.disc_on_wall((cx, y0 + 0.47, R - 0.008), 0.06, (1, 0, 0), (0, 1, 0), (210, 200, 170), 8, bias=1.5)
    s.disc_on_wall((cx, y0 + 0.47, R - 0.009), 0.09, (1, 0, 0), (0, 1, 0), (220, 180, 70), 10, bias=1.4)  # halo

    # narrow lancet window on the x = R wall
    rr.wall_quad(s, "xR", 2.2, 2.6, 1.3, 2.1, (44, 40, 44), inset=0.004, bias=0.5)
    rr.wall_quad(s, "xR", 2.25, 2.55, 1.35, 2.05, (50, 70, 140), inset=0.006, bias=1)
    rr.wall_quad(s, "xR", 2.38, 2.42, 1.35, 2.05, (40, 36, 40), inset=0.008, bias=1.5)


def chapel_c(s):
    """Lectern + hymnal near z = 0, sanctuary lamp hanging above, confessional on x = 0."""
    # pool of red light on the floor under the lamp
    s.quad([(0.9, 0.003, 1.2), (1.9, 0.003, 1.2), (2.0, 0.003, 2.3), (0.9, 0.003, 2.3)], (110, 50, 46), bias=-44)
    # lectern: a column on a base, its desk sloping down toward the viewer
    zb, zf, xa, xb = 0.65, 1.15, 1.8, 2.6
    s.box(1.95, 2.45, 0, 0.08, 0.65, 1.15, (70, 46, 30))
    s.box(2.12, 2.28, 0.08, 1.0, 0.82, 0.98, (96, 62, 38))
    s.box(xa, xb, 0.94, 1.0, zb, zf, (80, 52, 32))
    def on_desk(u, t, lift):  # t = 0 at the front edge, 1 at the back
        return (u, 1.0 + 0.28 * t + lift, zf - (zf - zb) * t)
    s.quad([on_desk(xa, 0, 0), on_desk(xb, 0, 0), on_desk(xb, 1, 0), on_desk(xa, 1, 0)], (110, 72, 44), bias=0.5)
    s.box(xa, xb, 1.0, 1.28, zb - 0.04, zb, (80, 52, 32))  # back board
    # open hymnal on the desk, with a red ribbon
    for u0, u1, col in ((1.86, 2.19, (214, 204, 178)), (2.21, 2.54, (232, 222, 196))):
        s.quad([on_desk(u0, 0.1, 0.02), on_desk(u1, 0.1, 0.02), on_desk(u1, 0.92, 0.02), on_desk(u0, 0.92, 0.02)],
               col, bias=1)
        for k in range(5):  # lines of text
            t = 0.22 + k * 0.14
            s.quad([on_desk(u0 + 0.04, t, 0.025), on_desk(u1 - 0.04, t, 0.025),
                    on_desk(u1 - 0.04, t + 0.04, 0.025), on_desk(u0 + 0.04, t + 0.04, 0.025)], (80, 70, 62), bias=1.2)
    s.quad([on_desk(2.19, -0.12, 0.03), on_desk(2.22, -0.12, 0.03), on_desk(2.22, 0.5, 0.03), on_desk(2.19, 0.5, 0.03)],
           (170, 20, 30), bias=1.4)

    # sanctuary lamp on a long chain, red glass with a flame
    lx, lz = 1.35, 1.75
    s.beam((lx, H, lz), (lx, 1.95, lz), 0.02, (60, 56, 50))
    for dx, dz in ((-0.12, 0), (0.12, 0), (0, -0.12), (0, 0.12)):
        s.beam((lx, 1.95, lz), (lx + dx, 1.78, lz + dz), 0.012, (140, 116, 60), bias=0.2)
    s.box(lx - 0.13, lx + 0.13, 1.74, 1.78, lz - 0.13, lz + 0.13, (160, 130, 64), bias=0.3)
    s.box(lx - 0.1, lx + 0.1, 1.52, 1.74, lz - 0.1, lz + 0.1, (220, 40, 36), bias=0.4)
    s.box(lx - 0.035, lx + 0.035, 1.6, 1.7, lz - 0.035, lz + 0.035, (255, 200, 120), bias=0.6)
    s.box(lx - 0.06, lx + 0.06, 1.46, 1.52, lz - 0.06, lz + 0.06, (160, 130, 64), bias=0.3)

    # confessional against the x = 0 wall
    wood, dark = (100, 64, 38), (66, 42, 26)
    z0, z1 = 1.3, 2.9
    s.box(0, 0.8, 0, 2.2, z0, z1, wood)
    s.box(0, 0.88, 2.2, 2.32, z0 - 0.05, z1 + 0.05, dark)  # cornice
    s.quad([(0, 2.32, z0), (0, 2.32, z1), (0, 2.6, (z0 + z1) / 2)], dark, bias=-20)  # gable on the wall
    xf = 0.802
    # left: priest's door with panels; right: penitent's curtained booth
    s.quad([(xf, 0.1, z0 + 0.1), (xf, 0.1, z0 + 0.72), (xf, 2.0, z0 + 0.72), (xf, 2.0, z0 + 0.1)], dark, bias=0.5)
    for y in (0.3, 1.2):
        s.quad([(xf + 0.002, y, z0 + 0.18), (xf + 0.002, y, z0 + 0.64), (xf + 0.002, y + 0.65, z0 + 0.64),
                (xf + 0.002, y + 0.65, z0 + 0.18)], (88, 56, 34), bias=0.8)
    s.disc_on_wall((xf + 0.004, 1.05, z0 + 0.64), 0.03, (0, 0, 1), (0, 1, 0), (190, 160, 70), 6, bias=1)
    s.quad([(xf, 0.25, z0 + 0.85), (xf, 0.25, z1 - 0.1), (xf, 2.0, z1 - 0.1), (xf, 2.0, z0 + 0.85)],
           (24, 18, 16), bias=0.5)  # dark opening
    for k in range(6):  # folds of a purple curtain
        za = z0 + 0.87 + k * 0.105
        col = (92, 40, 70) if k % 2 else (72, 30, 56)
        s.quad([(xf + 0.004, 0.45, za), (xf + 0.004, 0.45, za + 0.105), (xf + 0.004, 2.0, za + 0.105),
                (xf + 0.004, 2.0, za)], col, bias=0.8)


ROOM = dict(a=[shell, chapel_a], c=[shell, chapel_c], light_a=(150, 110), light_c=(185, 115), light=EMBER)
