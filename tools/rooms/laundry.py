"""The Laundry: copper boiler, coal scuttle, washtub with soap dish under a fogged window, mangle (A);
clothesline of sheets over a wicker basket, linen press, flat irons on a shelf and the servants' door (C)."""

import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT


def shell(s, far_walls):
    """Limewashed walls with damp stains, a brick-red tiled floor with a drain."""
    rr.walls_floor(s, (96, 70, 58), (54, 52, 48), (116, 116, 106), (132, 132, 120))
    rng = random.Random(10)
    for k in range(1, 10):  # floor tiles
        t = R * k / 10
        s.quad([(0, 0.001, t), (R, 0.001, t), (R, 0.001, t + 0.02), (0, 0.001, t + 0.02)], (70, 50, 42), bias=-45)
        s.quad([(t, 0.001, 0), (t + 0.02, 0.001, 0), (t + 0.02, 0.001, R), (t, 0.001, R)], (70, 50, 42), bias=-45)
    s.disc_on_wall((2.0, 0.003, 2.0), 0.12, (1, 0, 0), (0, 0, 1), (40, 36, 34), 8, bias=-44)  # drain
    for wall in far_walls:
        # skirting and a damp tide line
        rr.wall_quad(s, wall, 0, R, 0, 0.14, (70, 66, 60), inset=0.002, bias=-39)
        for _ in range(4):
            u, y, r = rng.uniform(0.4, 3.6), rng.uniform(0.4, 2.2), rng.uniform(0.18, 0.4)
            c = {"zR": (u, y, R - 0.002), "z0": (u, y, 0.002), "xR": (R - 0.002, y, u), "x0": (0.002, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, r, axis, (0, 0.7, 0), (100, 104, 90), 7, bias=-38)
    # ceiling beams
    for k in (1, 2, 3):
        x = R * k / 4
        s.box(x - 0.06, x + 0.06, HH - 0.14, HH, 0, R, (70, 56, 44), bias=-30)


def laundry_a(s):
    """Boiler and scuttle, washtub with soap dish under the window on the z = R wall; mangle on x = R."""
    brick, brick_dark = (132, 66, 48), (84, 44, 34)
    copper, copper_hi = (184, 104, 58), (214, 140, 84)
    # brick firebox
    s.box(0.6, 1.7, 0, 0.72, R - 0.8, R - 0.02, brick)
    for y in (0.18, 0.36, 0.54):
        rr.wall_quad(s, "zR", 0.6, 1.7, y, y + 0.015, brick_dark, inset=0.802, bias=1)
    zf = R - 0.804
    rr.wall_quad(s, "zR", 0.9, 1.4, 0.12, 0.5, (46, 42, 40), inset=0.804, bias=1.2)  # firebox door
    for k in range(4):
        x = 0.96 + k * 0.11
        rr.wall_quad(s, "zR", x, x + 0.05, 0.18, 0.44, (22, 20, 20), inset=0.808, bias=1.5)
    s.box(1.1, 1.2, 0.4, 0.44, zf - 0.05, zf, (170, 150, 80), bias=1.6)
    # copper boiler on top, with a lid, a tap and a flue
    s.box(0.68, 1.62, 0.72, 1.32, R - 0.74, R - 0.08, copper)
    for y in (0.86, 1.18):  # rivet bands
        s.box(0.66, 1.64, y, y + 0.03, R - 0.76, R - 0.06, copper_hi, bias=0.3)
    s.box(0.62, 1.68, 1.32, 1.38, R - 0.78, R - 0.04, (150, 84, 48))  # rim
    s.box(0.8, 1.5, 1.38, 1.44, R - 0.66, R - 0.16, (120, 70, 44))  # wooden lid
    s.box(1.1, 1.2, 1.44, 1.5, R - 0.45, R - 0.35, (170, 150, 80))  # lid knob
    s.beam((1.15, 0.95, R - 0.74), (1.15, 0.95, R - 0.9), 0.05, (170, 150, 80))  # tap
    s.beam((1.15, 0.95, R - 0.9), (1.15, 0.86, R - 0.9), 0.04, (170, 150, 80))
    s.beam((1.5, 0.6, R - 0.06), (1.5, HH, R - 0.06), 0.14, (60, 58, 56))  # flue
    # coal scuttle beside the firebox
    s.box(0.12, 0.5, 0, 0.32, R - 0.95, R - 0.6, (52, 50, 48))
    s.box(0.14, 0.48, 0.32, 0.36, R - 0.93, R - 0.62, (24, 22, 22), bias=0.4)  # coal heap
    s.beam((0.12, 0.42, R - 0.78), (0.5, 0.42, R - 0.78), 0.03, (70, 68, 64), bias=0.5)  # handle

    # zinc washtub on a wooden stand
    wood = (110, 80, 52)
    for lx in (2.05, 3.05):
        for lz in (R - 0.78, R - 0.16):
            s.box(lx, lx + 0.07, 0, 0.5, lz, lz + 0.07, (80, 58, 38))
    s.box(2.0, 3.17, 0.5, 0.56, R - 0.82, R - 0.08, wood)
    zinc = (150, 156, 158)
    s.box(2.06, 3.11, 0.56, 0.92, R - 0.78, R - 0.12, zinc)
    s.box(2.02, 3.15, 0.92, 0.96, R - 0.82, R - 0.08, (176, 182, 184), bias=0.3)  # rolled rim
    s.quad([(2.1, 0.962, R - 0.74), (3.07, 0.962, R - 0.74), (3.07, 0.962, R - 0.16), (2.1, 0.962, R - 0.16)],
           (92, 98, 96), bias=0.6)  # grey water
    s.quad([(2.3, 0.966, R - 0.6), (2.75, 0.966, R - 0.66), (2.8, 0.966, R - 0.4), (2.4, 0.966, R - 0.36)],
           (118, 124, 120), bias=0.8)  # scum
    s.box(2.85, 3.05, 0.6, 1.25, R - 0.3, R - 0.24, (128, 96, 62), bias=0.9)  # washboard
    for y in (0.8, 0.9, 1.0, 1.1):
        s.box(2.86, 3.04, y, y + 0.03, R - 0.31, R - 0.3, (90, 66, 44), bias=1)
    # soap dish with a yellow cake of soap on the front rim
    s.box(2.25, 2.5, 0.96, 0.99, R - 0.88, R - 0.76, (210, 210, 200), bias=1.2)
    s.box(2.29, 2.46, 0.99, 1.05, R - 0.86, R - 0.78, (220, 190, 70), bias=1.4)
    # fogged window above the tub
    rr.wall_quad(s, "zR", 2.2, 3.0, 1.4, 2.2, (96, 76, 52), inset=0.003, bias=0.5)
    rr.wall_quad(s, "zR", 2.26, 2.94, 1.46, 2.14, (150, 160, 162), inset=0.005, bias=1)
    rr.wall_quad(s, "zR", 2.59, 2.61, 1.46, 2.14, (96, 76, 52), inset=0.007, bias=1.5)
    rr.wall_quad(s, "zR", 2.26, 2.94, 1.79, 1.81, (96, 76, 52), inset=0.007, bias=1.5)
    for (u, y) in ((2.4, 1.6), (2.8, 1.95), (2.5, 2.0)):  # drips in the fog
        rr.wall_quad(s, "zR", u, u + 0.015, y - 0.18, y, (110, 120, 124), inset=0.008, bias=1.6)

    # iron mangle against the x = R wall
    iron = (60, 60, 62)
    xm0, xm1 = R - 0.75, R - 0.2
    for z in (1.5, 2.45):  # two cast-iron side frames
        s.box(xm0, xm1, 0, 0.08, z, z + 0.08, iron)
        s.box(xm0 + 0.2, xm0 + 0.3, 0.08, 1.35, z, z + 0.08, iron)
        s.beam((xm0, 0.08, z + 0.04), (xm0 + 0.25, 0.7, z + 0.04), 0.06, iron)
        s.beam((xm1, 0.08, z + 0.04), (xm0 + 0.25, 0.7, z + 0.04), 0.06, iron)
    s.box(xm0 + 0.15, xm0 + 0.35, 1.35, 1.42, 1.5, 2.53, iron)  # top bar
    for y in (0.98, 1.16):  # wooden rollers
        s.beam((xm0 + 0.25, y, 1.52), (xm0 + 0.25, y, 2.51), 0.16, (176, 150, 112))
    s.box(xm0 - 0.25, xm0 + 0.2, 0.84, 0.88, 1.6, 2.4, (120, 90, 60))  # feed board
    # crank wheel on the near frame, with spokes and a handle
    wc = (xm0 + 0.25, 1.07, 1.42)
    s.disc_on_wall(wc, 0.34, (1, 0, 0), (0, 1, 0), (44, 44, 46), 14, bias=1.2)
    s.disc_on_wall((wc[0], wc[1], 1.415), 0.27, (1, 0, 0), (0, 1, 0), (150, 150, 140), 14, bias=1.25)
    for dx, dy in ((0.27, 0), (-0.27, 0), (0, 0.27), (0, -0.27)):
        s.beam((wc[0], wc[1], 1.41), (wc[0] + dx, wc[1] + dy, 1.41), 0.04, (44, 44, 46), bias=1.4)
    s.beam((wc[0] + 0.25, wc[1] + 0.12, 1.41), (wc[0] + 0.25, wc[1] + 0.12, 1.25), 0.05, (110, 80, 52), bias=1.5)


def laundry_c(s):
    """Clothesline of sheets over a basket, linen press on the z = 0 wall; door and iron shelf on x = 0."""
    # clothesline strung across, with stiff grey sheets
    s.beam((0.0, 2.15, 0.8), (2.2, 2.15, 0.8), 0.02, (160, 150, 130))
    s.beam((2.2, 2.15, 0.8), (2.2, 2.15, 0.0), 0.02, (160, 150, 130))
    rng = random.Random(4)
    x = 0.1
    for w in (0.62, 0.7, 0.55):
        drop = rng.uniform(0.85, 1.0)
        g = rng.randint(-8, 8)
        s.quad([(x, 2.14, 0.8), (x + w, 2.14, 0.8), (x + w, 2.14 - drop, 0.8 + 0.04), (x, 2.14 - drop, 0.8 + 0.02)],
               (112 + g, 114 + g, 112 + g), bias=2)
        s.quad([(x + 0.02, 2.14 - drop + 0.12, 0.81), (x + w - 0.02, 2.14 - drop + 0.12, 0.83),
                (x + w - 0.02, 2.14 - drop + 0.06, 0.835), (x + 0.02, 2.14 - drop + 0.06, 0.815)],
               (88 + g, 90 + g, 86 + g), bias=2.2)  # a grimy stripe
        for px in (x + 0.05, x + w - 0.07):  # pegs
            s.box(px, px + 0.03, 2.08, 2.2, 0.78, 0.82, (130, 100, 60), bias=2.4)
        x += w + 0.06
    # wicker basket of linen under the line
    wicker = (150, 116, 66)
    s.box(0.7, 1.5, 0, 0.42, 1.05, 1.6, wicker)
    for y in (0.1, 0.2, 0.3):
        s.box(0.69, 1.51, y, y + 0.02, 1.04, 1.61, (110, 82, 46), bias=0.3)
    s.box(0.72, 1.48, 0.42, 0.52, 1.07, 1.58, (176, 172, 158), bias=0.5)  # linen heap
    s.box(0.9, 1.3, 0.52, 0.58, 1.15, 1.45, (160, 150, 140), bias=0.6)

    # tall oak linen press on the z = 0 wall
    oak, oak_dark = (98, 64, 40), (62, 40, 26)
    s.box(2.45, 3.6, 0, 2.05, 0.0, 0.58, oak)
    s.box(2.4, 3.65, 2.05, 2.13, 0.0, 0.62, (120, 80, 50))  # cornice
    s.box(2.42, 3.63, 0, 0.1, 0.0, 0.6, oak_dark)  # plinth
    zf = 0.582
    for x0 in (2.55, 3.05):  # two doors with panels
        rr.wall_quad(s, "z0", x0, x0 + 0.46, 0.18, 1.95, oak_dark, inset=zf, bias=1)
        rr.wall_quad(s, "z0", x0 + 0.05, x0 + 0.41, 0.25, 1.0, (114, 76, 46), inset=zf + 0.002, bias=1.2)
        rr.wall_quad(s, "z0", x0 + 0.05, x0 + 0.41, 1.1, 1.88, (114, 76, 46), inset=zf + 0.002, bias=1.2)
    # brass lock with four dials across the doors' seam
    s.box(2.84, 3.26, 1.0, 1.14, zf, zf + 0.04, (170, 140, 70), bias=1.5)
    for i in range(4):
        s.disc_on_wall((2.9 + i * 0.1, 1.07, zf + 0.045), 0.035, (1, 0, 0), (0, 1, 0), (230, 210, 140), 6, bias=1.8)

    # servants' door on the x = 0 wall
    rr.wall_quad(s, "x0", 1.1, 2.1, 0, 2.15, (74, 60, 46), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.17, 2.03, 0, 2.08, (126, 104, 78), inset=0.006, bias=1)
    for z0, z1, y0, y1 in ((1.25, 1.95, 1.15, 1.95), (1.25, 1.95, 0.15, 0.95)):
        rr.wall_quad(s, "x0", z0, z1, y0, y1, (108, 88, 64), inset=0.008, bias=1.2)
    s.box(0.006, 0.05, 0.92, 1.18, 1.86, 1.98, (110, 70, 50), bias=1.5)  # rusty lock plate
    rr.wall_quad(s, "x0", 1.91, 1.94, 0.98, 1.06, (14, 12, 10), inset=0.052, bias=2)
    s.box(0.006, 0.08, 1.2, 1.24, 1.76, 1.94, (150, 130, 70), bias=1.6)  # handle

    # shelf of flat irons on the x = 0 wall
    s.box(0.0, 0.3, 1.3, 1.35, 2.3, 3.0, (110, 80, 52))
    for zb in (2.42, 2.65, 2.88):
        s.box(0.05, 0.25, 1.35, 1.47, zb - 0.07, zb + 0.07, (50, 50, 52), bias=0.5)
        s.beam((0.15, 1.47, zb - 0.05), (0.15, 1.47, zb + 0.05), 0.04, (30, 30, 30), bias=0.6)
        s.beam((0.15, 1.47, zb - 0.05), (0.15, 1.56, zb - 0.03), 0.03, (30, 30, 30), bias=0.6)
        s.beam((0.15, 1.47, zb + 0.05), (0.15, 1.56, zb + 0.03), 0.03, (30, 30, 30), bias=0.6)
        s.beam((0.15, 1.56, zb - 0.04), (0.15, 1.56, zb + 0.04), 0.03, (110, 80, 52), bias=0.7)
    # a puddle under the sheets
    s.quad([(0.4, 0.004, 0.9), (1.6, 0.004, 0.85), (1.9, 0.004, 1.0), (0.6, 0.004, 1.05)], (70, 64, 62), bias=-43)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), laundry_a],
    c=[lambda s: shell(s, ("z0", "x0")), laundry_c],
    light_a=(90, 150),
    light_c=(160, 110),
    light=rr.WARM,
)
