"""The Master Bedroom: four-poster bed, nightstand with an oil lamp, curtained window (A);
vanity with mirror and jewelry box, wardrobe and the hall door (C)."""

import math
import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT


def shell(s, far_walls):
    """Striped wallpaper over a wooden dado, parquet floor and a faded rug."""
    rr.walls_floor(s, (92, 62, 44), (50, 40, 40), (98, 70, 76), (112, 82, 86))
    for k in range(1, 14):  # floorboards
        z = R * k / 14
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], (62, 40, 28), bias=-45)
    rng = random.Random(16)
    for wall in far_walls:
        u = 0.1
        while u < R:  # wallpaper stripes
            rr.wall_quad(s, wall, u, u + 0.07, 0.9, HH, (84, 58, 66), inset=0.002, bias=-39)
            u += 0.28
        rr.wall_quad(s, wall, 0, R, 0, 0.9, (78, 52, 36), inset=0.003, bias=-38.8)  # dado
        rr.wall_quad(s, wall, 0, R, 0.88, 0.94, (120, 88, 56), inset=0.004, bias=-38.5)  # rail
        rr.wall_quad(s, wall, 0, R, 0, 0.1, (52, 34, 24), inset=0.004, bias=-38.5)  # skirting
        rr.wall_quad(s, wall, 0, R, HH - 0.1, HH, (130, 112, 104), inset=0.003, bias=-38.5)  # cornice
        for _ in range(2):
            u, y, r = rng.uniform(0.5, 3.5), rng.uniform(1.5, 2.3), rng.uniform(0.15, 0.3)
            c = {"zR": (u, y, R - 0.004), "z0": (u, y, 0.004), "xR": (R - 0.004, y, u), "x0": (0.004, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, r, axis, (0, 0.6, 0), (82, 60, 62), 7, bias=-38)
    # faded red rug in the middle of the room
    s.quad([(0.9, 0.003, 0.9), (3.1, 0.003, 0.9), (3.1, 0.003, 2.9), (0.9, 0.003, 2.9)], (92, 34, 34), bias=-44)
    s.quad([(1.05, 0.004, 1.05), (2.95, 0.004, 1.05), (2.95, 0.004, 2.75), (1.05, 0.004, 2.75)],
           (122, 56, 46), bias=-43)


def bedroom_a(s):
    """Four-poster bed against the z = R wall, nightstand and lamp beside it, window on the x = R wall."""
    wood, wood_dark = (96, 56, 34), (60, 36, 22)
    x0, x1, z0 = 0.95, 2.5, R - 1.95
    # posts and canopy
    for px in (x0, x1 - 0.08):
        for pz in (z0, R - 0.1):
            s.box(px, px + 0.08, 0, 2.2, pz, pz + 0.08, wood_dark, bias=0.2)
    s.box(x0, x1, 2.12, 2.22, z0, R - 0.02, (110, 40, 44), bias=0.1)  # canopy valance
    for k in range(6):  # valance pleats
        x = x0 + 0.1 + k * 0.26
        s.box(x, x + 0.04, 2.06, 2.14, z0 - 0.01, z0 + 0.01, (80, 26, 30), bias=0.3)
    # canopy curtains tied back at the foot posts
    for px in (x0, x1 - 0.08):
        s.box(px - 0.02, px + 0.1, 1.5, 2.12, z0 - 0.02, z0 + 0.1, (120, 44, 48), bias=0.4)
    # headboard, footboard, frame
    s.box(x0 + 0.08, x1 - 0.08, 0.3, 1.35, R - 0.1, R - 0.03, wood)
    rr.wall_quad(s, "zR", x0 + 0.25, x1 - 0.25, 0.75, 1.2, (120, 76, 46), inset=0.102, bias=0.6)
    s.box(x0 + 0.08, x1 - 0.08, 0.2, 0.8, z0, z0 + 0.06, wood)
    s.box(x0 + 0.06, x1 - 0.06, 0.2, 0.45, z0 + 0.06, R - 0.1, wood_dark)
    # mattress and covers, turned down near the pillows
    s.box(x0 + 0.08, x1 - 0.08, 0.45, 0.62, z0 + 0.06, R - 0.1, (200, 194, 176))
    s.box(x0 + 0.06, x1 - 0.06, 0.45, 0.66, z0 + 0.04, R - 0.75, (130, 52, 56), bias=0.2)  # bedspread
    s.box(x0 + 0.06, x1 - 0.06, 0.6, 0.68, R - 0.82, R - 0.68, (210, 204, 186), bias=0.3)  # folded sheet
    # pillows: the left one sits high on a hidden diary
    s.box(1.15, 1.7, 0.68, 0.82, R - 0.55, R - 0.18, (226, 222, 206), bias=0.4)
    s.box(1.8, 2.3, 0.62, 0.74, R - 0.55, R - 0.18, (218, 214, 198), bias=0.4)
    s.box(1.25, 1.55, 0.66, 0.71, R - 0.64, R - 0.52, (110, 62, 34), bias=0.5)  # diary corner peeking out

    # nightstand with an oil lamp
    s.box(2.75, 3.3, 0, 0.62, R - 0.5, R - 0.05, wood)
    s.box(2.72, 3.33, 0.62, 0.66, R - 0.53, R - 0.03, (120, 76, 46))
    zf = R - 0.502
    rr.wall_quad(s, "zR", 2.82, 3.23, 0.38, 0.56, (118, 74, 44), inset=0.502, bias=1)
    s.box(2.98, 3.08, 0.45, 0.49, zf - 0.04, zf, (190, 160, 80), bias=1.5)
    s.box(2.92, 3.14, 0.66, 0.72, R - 0.36, R - 0.16, (150, 120, 60), bias=0.6)  # lamp base
    s.box(2.96, 3.1, 0.72, 0.9, R - 0.33, R - 0.19, (130, 150, 90), bias=0.7)  # oil font
    s.box(2.99, 3.07, 0.9, 1.16, R - 0.3, R - 0.22, (176, 190, 186), bias=0.8)  # glass chimney

    # window on the x = R wall with heavy curtains
    rr.wall_quad(s, "xR", 1.3, 2.5, 1.0, 2.15, (70, 46, 30), inset=0.004, bias=0.5)
    rr.wall_quad(s, "xR", 1.38, 2.42, 1.06, 2.09, (22, 26, 40), inset=0.006, bias=1)
    rr.wall_quad(s, "xR", 1.88, 1.92, 1.06, 2.09, (70, 46, 30), inset=0.008, bias=1.5)
    rr.wall_quad(s, "xR", 1.38, 2.42, 1.56, 1.6, (70, 46, 30), inset=0.008, bias=1.5)
    rng = random.Random(4)
    for _ in range(9):  # rain streaks
        z, y = rng.uniform(1.42, 2.38), rng.uniform(1.15, 1.95)
        rr.wall_quad(s, "xR", z, z + 0.012, y, y + 0.12, (60, 70, 96), inset=0.009, bias=1.6)
    for z0c, z1c in ((1.05, 1.45), (2.35, 2.75)):  # curtains
        s.box(R - 0.1, R - 0.01, 0.15, 2.3, z0c, z1c, (110, 40, 44), bias=1.2)
        for k in range(3):
            z = z0c + 0.06 + k * 0.12
            s.box(R - 0.115, R - 0.1, 0.15, 2.3, z, z + 0.03, (84, 28, 32), bias=1.4)
    s.beam((R - 0.06, 2.35, 0.95), (R - 0.06, 2.35, 2.85), 0.04, (150, 120, 60), bias=1.3)  # curtain rod


def bedroom_c(s):
    """Vanity with an oval mirror and jewelry box on the z = 0 wall, wardrobe and door on the x = 0 wall."""
    wood, wood_dark = (100, 60, 36), (64, 38, 24)
    # vanity table
    vx0, vx1 = 1.7, 2.8
    for lx in (vx0 + 0.04, vx1 - 0.1):
        s.box(lx, lx + 0.06, 0, 0.7, 0.36, 0.42, wood_dark)
    s.box(vx0, vx1, 0.58, 0.76, 0.02, 0.46, wood)
    s.box(vx0 - 0.03, vx1 + 0.03, 0.76, 0.8, 0.0, 0.49, (130, 84, 52))
    rr.wall_quad(s, "z0", vx0 + 0.2, vx1 - 0.2, 0.61, 0.73, (120, 76, 46), inset=0.462, bias=1)
    s.box(2.2, 2.3, 0.65, 0.69, 0.46, 0.5, (190, 160, 80), bias=1.5)  # drawer pull
    # oval mirror in a gilt frame
    s.box(2.2, 2.3, 0.8, 1.05, 0.02, 0.08, wood_dark)
    c = (2.25, 1.45, 0.06)
    for k, (r, col) in enumerate(((0.44, (170, 140, 70)), (0.39, (96, 116, 124)), (0.3, (120, 140, 148)))):
        pts = []
        for i in range(14):
            a = 2 * math.pi * i / 14
            pts.append((c[0] + r * 0.75 * math.cos(a), c[1] + r * math.sin(a), c[2] + 0.002 * k))
        s.quad(pts, col, bias=1 + 0.2 * k)
    # silver jewelry box with four dials, a hairbrush and a perfume bottle
    s.box(2.05, 2.45, 0.8, 0.95, 0.12, 0.34, (176, 178, 184), bias=0.6)
    s.box(2.03, 2.47, 0.95, 0.99, 0.1, 0.36, (200, 202, 208), bias=0.7)
    for i in range(4):
        x = 2.11 + i * 0.09
        s.disc_on_wall((x, 0.875, 0.342), 0.025, (1, 0, 0), (0, 1, 0), (60, 60, 66), 6, bias=1.2)
    s.box(1.8, 1.95, 0.8, 0.84, 0.2, 0.3, (130, 90, 60), bias=0.6)  # hairbrush
    s.box(2.58, 2.66, 0.8, 0.96, 0.2, 0.28, (120, 60, 110), bias=0.6)  # perfume
    s.box(2.6, 2.64, 0.96, 1.0, 0.22, 0.26, (190, 160, 80), bias=0.7)
    # stool
    s.box(2.0, 2.5, 0.42, 0.5, 0.65, 1.0, (130, 52, 56))
    for lx in (2.03, 2.43):
        for lz in (0.68, 0.93):
            s.box(lx, lx + 0.04, 0, 0.42, lz, lz + 0.04, wood_dark)

    # tall walnut wardrobe against the x = 0 wall
    wz0, wz1, depth = 0.4, 1.55, 0.6
    s.box(0.0, depth, 0, 0.1, wz0, wz1, wood_dark)
    s.box(0.0, depth, 0.1, 2.25, wz0, wz1, (88, 54, 34))
    s.box(0.0, depth + 0.04, 2.25, 2.35, wz0 - 0.04, wz1 + 0.04, (110, 70, 42))  # cornice
    xf = depth + 0.003
    for z0d, z1d in ((wz0 + 0.06, (wz0 + wz1) / 2 - 0.01), ((wz0 + wz1) / 2 + 0.01, wz1 - 0.06)):
        s.quad([(xf, 0.2, z0d), (xf, 0.2, z1d), (xf, 2.15, z1d), (xf, 2.15, z0d)], (110, 70, 44), bias=1)
        s.quad([(xf + 0.002, 0.35, z0d + 0.07), (xf + 0.002, 0.35, z1d - 0.07), (xf + 0.002, 2.0, z1d - 0.07),
                (xf + 0.002, 2.0, z0d + 0.07)], (92, 58, 36), bias=1.2)
    zm = (wz0 + wz1) / 2
    for dz in (-0.06, 0.04):
        s.box(xf, xf + 0.05, 1.05, 1.25, zm + dz, zm + dz + 0.02, (190, 160, 80), bias=1.5)
    s.quad([(xf + 0.004, 0.98, zm - 0.012), (xf + 0.004, 0.98, zm + 0.012), (xf + 0.004, 1.02, zm + 0.012),
            (xf + 0.004, 1.02, zm - 0.012)], (14, 10, 8), bias=2)  # tiny keyhole

    # door to the hall on the x = 0 wall
    rr.wall_quad(s, "x0", 2.2, 3.3, 0, 2.2, (56, 36, 24), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 2.28, 3.22, 0, 2.12, (112, 72, 44), inset=0.006, bias=1)
    for (y0, y1) in ((0.2, 0.95), (1.15, 1.95)):
        rr.wall_quad(s, "x0", 2.4, 3.1, y0, y1, (90, 56, 32), inset=0.008, bias=1.5)
    s.box(0.006, 0.07, 1.0, 1.06, 2.36, 2.46, (190, 160, 80), bias=1.6)  # knob


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), bedroom_a],
    c=[lambda s: shell(s, ("z0", "x0")), bedroom_c],
    light_a=(230, 120),
    light_c=(150, 100),
    light=rr.WARM,
)
