"""The Rooftop Greenhouse: a glass room on the roof, lit by the moon.

Camera A: potting bench with clay pots (one with baked, cracked soil and a
glint of metal), a cabinet under the bench, dead vines on the glass.
Camera C: rain barrel, glass stairwell door with an iron lock, broken panes.
"""

import math
import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
KNEE = 0.8  # top of the brick knee wall; glass above
IRON = (34, 38, 44)
GLASS = (44, 58, 86)
SKY = (70, 86, 124)
CLAY = (150, 76, 48)
WOOD = (100, 70, 44)


def cylinder(s, cx, cz, r, y0, y1, color, segments=10, top=None, bias=0.0):
    """Upright prism around (cx, cz); sides shaded by angle, optional top cap."""
    pts = [(cx + r * math.cos(2 * math.pi * i / segments), cz + r * math.sin(2 * math.pi * i / segments))
           for i in range(segments)]
    cam = s.cam.pos
    for i, (ax, az) in enumerate(pts):
        bx, bz = pts[(i + 1) % segments]
        mx, mz = (ax + bx) / 2, (az + bz) / 2
        nx, nz = mx - cx, mz - cz
        if nx * (cam[0] - mx) + nz * (cam[2] - mz) <= 0:
            continue
        light = 0.65 + 0.35 * max(0.0, (nx * 0.6 - nz * 0.8) / r)
        s.quad([(ax, y0, az), (bx, y0, bz), (bx, y1, bz), (ax, y1, az)],
               tuple(int(c * light) for c in color), bias=bias)
    if top:
        s.quad([(x, y1, z) for x, z in pts], top, bias=bias + 0.05)


def shell(s):
    rng = random.Random(14)
    rr.walls_floor(s, (70, 70, 72), (30, 36, 52), (62, 46, 40), (74, 54, 46))
    # stone floor tiles
    for k in range(1, 8):
        t = R * k / 8
        s.quad([(0, 0.001, t), (R, 0.001, t), (R, 0.001, t + 0.02), (0, 0.001, t + 0.02)], (50, 50, 54), bias=-45)
        s.quad([(t, 0.001, 0), (t + 0.02, 0.001, 0), (t + 0.02, 0.001, R), (t, 0.001, R)], (50, 50, 54), bias=-45)
    for wall in ("z0", "zR", "x0", "xR"):
        # brick knee wall: courses of bricks
        y, row = 0.0, 0
        while y < KNEE - 0.01:
            u = -0.15 if row % 2 else 0.0
            while u < R:
                g = rng.randint(-10, 10)
                wall_col = (96 + g, 60 + g // 2, 48 + g // 2)
                rr.wall_quad(s, wall, max(u, 0) + 0.015, min(u + 0.3, R) - 0.015, y + 0.012, y + 0.1,
                             wall_col, inset=0.003, bias=-39)
                u += 0.3
            y += 0.112
            row += 1
        rr.wall_quad(s, wall, 0, R, KNEE, KNEE + 0.06, (88, 84, 80), inset=0.006, bias=-38)  # sill
        # glass above the knee wall, in panes between iron mullions
        rr.wall_quad(s, wall, 0, R, KNEE + 0.06, HH, GLASS, inset=0.002, bias=-39)
        u = 0.0
        while u <= R + 0.01:
            rr.wall_quad(s, wall, u - 0.025, u + 0.025, KNEE + 0.06, HH, IRON, inset=0.008, bias=-37)
            u += 0.5
        for yy in (1.55, 2.2):
            rr.wall_quad(s, wall, 0, R, yy - 0.02, yy + 0.02, IRON, inset=0.008, bias=-37)
    # glass roof: ribs and night sky
    s.quad([(0, HH - 0.002, 0), (R, HH - 0.002, 0), (R, HH - 0.002, R), (0, HH - 0.002, R)], (28, 34, 56), bias=-49)
    for k in range(1, 8):
        x = R * k / 8
        s.box(x - 0.025, x + 0.025, HH - 0.08, HH, 0, R, IRON, bias=-30)


def stars(s, wall, n, seed, y0=1.0):
    rng = random.Random(seed)
    for _ in range(n):
        u, y = rng.uniform(0.1, R - 0.1), rng.uniform(y0, HH - 0.1)
        rr.wall_quad(s, wall, u, u + 0.02, y, y + 0.02, (190, 196, 220), inset=0.004, bias=-36)


def vine(s, wall, u, rng, color=(70, 64, 46)):
    """A dead, zig-zagging vine climbing the glass."""
    y = KNEE + 0.05
    inset = 0.02
    while y < HH - 0.2:
        nu = u + rng.uniform(-0.18, 0.18)
        ny = y + rng.uniform(0.15, 0.3)
        a = (u, y, R - inset) if wall == "zR" else (R - inset, y, u)
        b = (nu, ny, R - inset) if wall == "zR" else (R - inset, ny, nu)
        s.beam(a, b, 0.03, color, bias=-20)
        if rng.random() < 0.6:  # a dry leaf
            lu, ly = nu + rng.uniform(-0.08, 0.08), ny - 0.05
            leaf = [(lu, ly), (lu + 0.07, ly + 0.04), (lu + 0.02, ly + 0.09)]
            pts = [(p, q, R - inset - 0.004) if wall == "zR" else (R - inset - 0.004, q, p) for p, q in leaf]
            s.quad(pts, (96, 84, 52), bias=-19)
        u, y = nu, ny


def greenhouse_a(s):
    stars(s, "zR", 18, 3)
    stars(s, "xR", 14, 4)
    rng = random.Random(8)
    for u in (0.5, 1.2, 3.6):
        vine(s, "zR", u, rng)
    for u in (1.0, 2.0, 3.0):
        vine(s, "xR", u, rng)
    # potting bench against the z = R wall
    x0, x1, zf = 0.7, 3.4, R - 0.7
    s.box(x0, x1, 0.82, 0.9, zf, R - 0.02, WOOD)
    for lx in (x0 + 0.03, x1 - 0.09):
        for lz in (zf + 0.03, R - 0.1):
            s.box(lx, lx + 0.06, 0, 0.82, lz, lz + 0.06, (70, 48, 30))
    # cabinet under the bench
    cx0, cx1 = 1.45, 2.65
    s.box(cx0, cx1, 0.05, 0.8, zf + 0.04, R - 0.06, (88, 62, 40), bias=0.2)
    zc = zf + 0.035
    for (a, b) in ((cx0 + 0.05, (cx0 + cx1) / 2 - 0.02), ((cx0 + cx1) / 2 + 0.02, cx1 - 0.05)):
        s.quad([(a, 0.1, zc), (b, 0.1, zc), (b, 0.74, zc), (a, 0.74, zc)], (118, 86, 54), bias=1)
        s.quad([(a + 0.06, 0.18, zc - 0.002), (b - 0.06, 0.18, zc - 0.002), (b - 0.06, 0.66, zc - 0.002),
                (a + 0.06, 0.66, zc - 0.002)], (98, 70, 44), bias=1.2)
    mid = (cx0 + cx1) / 2
    for hx in (mid - 0.09, mid + 0.05):  # knobs
        s.box(hx, hx + 0.04, 0.42, 0.48, zc - 0.04, zc, (170, 150, 100), bias=1.5)
    # clay pots on the bench
    pots = [(0.95, 0.17), (1.5, 0.2), (2.1, 0.22), (2.7, 0.19), (3.15, 0.16)]
    cracked = 2
    for i, (px, pr) in enumerate(pots):
        pz = R - 0.38
        cylinder(s, px, pz, pr, 0.9, 1.22, CLAY, segments=9, bias=0.3)
        cylinder(s, px, pz, pr + 0.03, 1.18, 1.26, (170, 92, 58), segments=9, bias=0.35)
        if i == cracked:
            # pale, baked soil with dark cracks and a metal glint
            cylinder(s, px, pz, pr - 0.01, 1.25, 1.255, (176, 150, 112), segments=9,
                     top=(186, 160, 120), bias=0.4)
            for a in (0.3, 1.9, 3.8, 5.0):
                s.beam((px, 1.258, pz), (px + pr * 0.9 * math.cos(a), 1.258, pz + pr * 0.9 * math.sin(a)),
                       0.015, (60, 44, 32), bias=0.6)
            s.box(px + 0.04, px + 0.1, 1.255, 1.275, pz - 0.06, pz - 0.02, (230, 230, 220), bias=0.8)
        else:
            cylinder(s, px, pz, pr - 0.01, 1.2, 1.21, (52, 38, 28), segments=9, top=(52, 38, 28), bias=0.4)
            # dead stalks
            for k in range(3):
                a = 2 * math.pi * k / 3 + i
                s.beam((px, 1.21, pz), (px + 0.12 * math.cos(a), 1.5 + 0.08 * k, pz + 0.1 * math.sin(a)),
                       0.018, (84, 72, 48), bias=0.5)
    # a trowel and a sack of soil
    s.box(3.5, 3.9, 0, 0.5, R - 0.5, R - 0.08, (120, 104, 76))
    s.box(3.52, 3.88, 0.5, 0.56, R - 0.48, R - 0.1, (104, 90, 66))
    # moonlight on the floor
    s.quad([(1.0, 0.003, 1.8), (2.8, 0.003, 1.6), (3.2, 0.003, 2.8), (1.3, 0.003, 3.0)], (92, 100, 124), bias=-44)


def greenhouse_c(s):
    stars(s, "z0", 16, 5)
    stars(s, "x0", 12, 6)
    # the moon, low over the z = 0 wall
    s.disc_on_wall((2.9, 2.05, 0.004), 0.17, (1, 0, 0), (0, 1, 0), (224, 226, 210), 12, bias=-35)
    # broken panes: jagged holes of brighter sky, shards on the floor
    for wall, u0, y0 in (("z0", 0.5, 1.6), ("z0", 3.0, 0.9), ("x0", 0.5, 1.6), ("x0", 3.0, 1.0)):
        hole = [(u0 + 0.03, y0 + 0.04), (u0 + 0.46, y0 + 0.03), (u0 + 0.38, y0 + 0.28), (u0 + 0.46, y0 + 0.55),
                (u0 + 0.26, y0 + 0.4), (u0 + 0.05, y0 + 0.55), (u0 + 0.14, y0 + 0.26)]
        pts = [(p, q, 0.005) if wall == "z0" else (0.005, q, p) for p, q in hole]
        s.quad(pts, SKY, bias=-34)
        pts = [(p, q, 0.006) if wall == "z0" else (0.006, q, p) for p, q in hole[:3]]
        s.quad(pts, (120, 140, 170), bias=-33)
    rng = random.Random(2)
    for _ in range(14):
        x, z = rng.uniform(0.2, 3.4), rng.uniform(0.15, 1.2)
        if rng.random() < 0.5:
            x, z = z, x
        s.quad([(x, 0.004, z), (x + 0.1, 0.004, z + 0.03), (x + 0.03, 0.004, z + 0.09)], (150, 170, 200), bias=-42)
    # moonlight pool
    s.quad([(1.6, 0.003, 0.6), (3.4, 0.003, 0.5), (3.6, 0.003, 1.9), (1.9, 0.003, 2.1)], (96, 104, 130), bias=-44)
    # rain barrel near the z = 0 wall
    bx, bz, br = 2.1, 0.6, 0.45
    cylinder(s, bx, bz, br, 0, 0.95, (112, 78, 46), segments=12, bias=0.2)
    for y in (0.12, 0.47, 0.82):
        cylinder(s, bx, bz, br + 0.012, y, y + 0.06, (60, 60, 66), segments=12, bias=0.3)
    cylinder(s, bx, bz, br - 0.03, 0.9, 0.92, (20, 26, 40), segments=12, top=(24, 34, 58), bias=0.4)  # water
    s.disc_on_wall((bx + 0.08, 0.925, bz + 0.05), 0.09, (1, 0, 0), (0, 0, 1), (170, 180, 210), 8, bias=0.6)
    # downpipe feeding it from the roof
    s.beam((bx - 0.15, HH, 0.06), (bx - 0.15, 1.1, 0.06), 0.07, (60, 62, 68))
    s.beam((bx - 0.15, 1.1, 0.06), (bx - 0.1, 0.98, 0.3), 0.07, (60, 62, 68))
    # glass stairwell door on the x = 0 wall
    z0, z1 = 1.5, 2.5
    rr.wall_quad(s, "x0", z0 - 0.08, z1 + 0.08, 0, 2.2, IRON, inset=0.01, bias=0.5)
    rr.wall_quad(s, "x0", z0, z1, 0.05, 2.12, (56, 62, 74), inset=0.012, bias=1)
    for (a, b, c, d) in ((z0 + 0.08, z1 - 0.08, 1.15, 2.04), (z0 + 0.08, z1 - 0.08, 0.15, 1.0)):
        rr.wall_quad(s, "x0", a, b, c, d, (78, 96, 128), inset=0.014, bias=1.2)  # glass
    # stairs going down, seen through the glass
    for k in range(4):
        rr.wall_quad(s, "x0", z0 + 0.1, z1 - 0.1, 0.25 + k * 0.18, 0.29 + k * 0.18, (40, 44, 56), inset=0.016, bias=1.3)
    # cracks in the upper pane
    s.beam((0.02, 1.9, z0 + 0.2), (0.02, 1.5, z0 + 0.5), 0.012, (180, 190, 210), bias=1.5)
    s.beam((0.02, 1.5, z0 + 0.5), (0.02, 1.3, z0 + 0.35), 0.012, (180, 190, 210), bias=1.5)
    # heavy iron lock box with a keyhole
    s.box(0.012, 0.1, 0.85, 1.3, z1 - 0.34, z1 - 0.04, (44, 44, 50), bias=2)
    rr.wall_quad(s, "x0", z1 - 0.26, z1 - 0.12, 0.95, 1.2, (110, 100, 80), inset=0.102, bias=2.3)  # plate
    rr.wall_quad(s, "x0", z1 - 0.21, z1 - 0.17, 1.0, 1.12, (10, 8, 8), inset=0.104, bias=2.5)  # keyhole
    s.box(0.012, 0.13, 1.2, 1.25, z1 - 0.5, z1 - 0.34, (120, 116, 112), bias=2.4)  # handle


ROOM = dict(a=[shell, greenhouse_a], c=[shell, greenhouse_c], light_a=(170, 70), light_c=(90, 60), light=rr.MOON)
