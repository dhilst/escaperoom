"""The Billiard Room: table under a hanging lamp, ball rack and cue rack (A);
scoreboard, liquor cabinet, armchair, cigar box and the panelling you came through (C)."""

import math
import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
WOOD, WOOD_DARK = (104, 64, 36), (66, 40, 24)


def shell(s, far_walls):
    """Dark green wallpaper over wood wainscoting, a parquet floor and a rug under the table."""
    rr.walls_floor(s, (92, 62, 40), (40, 36, 30), (46, 72, 54), (56, 86, 64))
    for k in range(1, 16):  # parquet strips
        x = R * k / 16
        s.quad([(x, 0.001, 0), (x + 0.02, 0.001, 0), (x + 0.02, 0.001, R), (x, 0.001, R)], (66, 44, 28), bias=-45)
    s.quad([(0.9, 0.003, 1.3), (3.2, 0.003, 1.3), (3.2, 0.003, 3.9), (0.9, 0.003, 3.9)], (96, 34, 30), bias=-44)
    s.quad([(1.0, 0.004, 1.4), (3.1, 0.004, 1.4), (3.1, 0.004, 3.8), (1.0, 0.004, 3.8)], (124, 50, 40), bias=-43)
    rng = random.Random(13)
    for wall in far_walls:
        rr.wall_quad(s, wall, 0, R, 0, 1.0, WOOD_DARK, inset=0.002, bias=-39)
        rr.wall_quad(s, wall, 0, R, 0.98, 1.05, (128, 86, 50), inset=0.003, bias=-38.5)
        u = 0.1
        while u < R - 0.3:  # raised panels in the wainscot
            rr.wall_quad(s, wall, u, u + 0.5, 0.15, 0.85, (88, 54, 30), inset=0.003, bias=-38.6)
            u += 0.62
        for k in range(8):  # wallpaper stripes
            u = 0.25 + k * 0.5
            rr.wall_quad(s, wall, u, u + 0.06, 1.05, HH, (40, 64, 46), inset=0.002, bias=-38.8)
        for _ in range(2):  # damp stains
            u, y, r = rng.uniform(0.5, 3.5), rng.uniform(1.6, 2.3), rng.uniform(0.15, 0.3)
            c = {"zR": (u, y, R - 0.002), "z0": (u, y, 0.002), "xR": (R - 0.002, y, u), "x0": (0.002, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, r, axis, (0, 0.6, 0), (40, 58, 42), 7, bias=-38)


def ball(s, x, z, color, stripe=False, y=0.86, r=0.055, bias=1.0):
    """A billiard ball: a small box with a white number spot (or a white band for a stripe)."""
    s.box(x - r, x + r, y, y + 2 * r, z - r, z + r, color, bias=bias)
    if stripe:
        s.box(x - r - 0.002, x + r + 0.002, y + 0.002, y + 2 * r - 0.002, z - r * 0.4, z + r * 0.4, (220, 214, 200), bias=bias + 0.1)
    s.box(x - r * 0.4, x + r * 0.4, y + 2 * r, y + 2 * r + 0.003, z - r * 0.4, z + r * 0.4, (230, 226, 214), bias=bias + 0.2)


def billiards_a(s):
    """The table in the middle of the room, the lamp above it, cue rack on the x = R wall."""
    x0, x1, z0, z1 = 1.25, 2.75, 1.45, 3.75
    # turned legs and the body
    for lx in (x0 + 0.1, x1 - 0.2):
        for lz in (z0 + 0.1, (z0 + z1) / 2 - 0.05, z1 - 0.2):
            s.box(lx, lx + 0.1, 0, 0.62, lz, lz + 0.1, WOOD_DARK)
    s.box(x0, x1, 0.62, 0.8, z0, z1, WOOD)
    # cushions (rails) and the cloth
    s.box(x0 - 0.06, x1 + 0.06, 0.8, 0.9, z0 - 0.06, z0 + 0.06, (120, 74, 42))
    s.box(x0 - 0.06, x1 + 0.06, 0.8, 0.9, z1 - 0.06, z1 + 0.06, (120, 74, 42))
    s.box(x0 - 0.06, x0 + 0.06, 0.8, 0.9, z0, z1, (120, 74, 42))
    s.box(x1 - 0.06, x1 + 0.06, 0.8, 0.9, z0, z1, (120, 74, 42))
    s.quad([(x0 + 0.06, 0.84, z0 + 0.06), (x1 - 0.06, 0.84, z0 + 0.06), (x1 - 0.06, 0.84, z1 - 0.06),
            (x0 + 0.06, 0.84, z1 - 0.06)], (46, 112, 66), bias=0.5)
    # dust patches on the cloth
    for (cx, cz) in ((1.8, 2.2), (2.2, 3.0), (1.7, 3.3)):
        s.quad([(cx, 0.842, cz), (cx + 0.25, 0.842, cz + 0.05), (cx + 0.2, 0.842, cz + 0.22), (cx - 0.02, 0.842, cz + 0.18)],
               (74, 112, 84), bias=0.6)
    # six pockets: dark discs at the corners and the middle of the long sides
    for (px, pz) in ((x0 + 0.04, z0 + 0.04), (x1 - 0.04, z0 + 0.04), (x0 + 0.02, (z0 + z1) / 2),
                     (x1 - 0.02, (z0 + z1) / 2), (x0 + 0.04, z1 - 0.04), (x1 - 0.04, z1 - 0.04)):
        s.disc_on_wall((px, 0.905, pz), 0.07, (1, 0, 0), (0, 0, 1), (14, 10, 8), 8, bias=1.2)
    # a gleam of yellow in the far corner pocket
    s.disc_on_wall((x1 - 0.04, 0.907, z1 - 0.04), 0.03, (1, 0, 0), (0, 0, 1), (200, 170, 40), 6, bias=1.4)
    # wooden triangle rack with balls, three gaps near the far end
    tz, tx = 3.0, 2.0
    s.beam((tx - 0.32, 0.87, tz), (tx + 0.32, 0.87, tz), 0.035, (150, 104, 60), bias=0.8)
    s.beam((tx - 0.32, 0.87, tz), (tx, 0.87, tz + 0.56), 0.035, (150, 104, 60), bias=0.8)
    s.beam((tx + 0.32, 0.87, tz), (tx, 0.87, tz + 0.56), 0.035, (150, 104, 60), bias=0.8)
    colors = [(40, 60, 160), (180, 40, 40), (110, 40, 120), (200, 110, 40), (30, 30, 30), (120, 40, 30),
              (40, 60, 160), (180, 40, 40), (110, 40, 120), (200, 110, 40), (120, 40, 30), (40, 120, 70)]
    k = 0
    gaps = {(1, 0), (2, 2), (3, 1)}  # three empty slots
    for row in range(4):
        for i in range(row + 1):
            if (row, i) in gaps:
                continue
            bx = tx + (i - row / 2) * 0.115
            bz = tz + 0.08 + (3 - row) * 0.1
            ball(s, bx, bz, colors[k % len(colors)], stripe=k % 2 == 1, bias=1.0 + row * 0.01)
            k += 1
    # the white cue ball near the near end
    ball(s, 1.75, 2.0, (226, 224, 214), bias=1.0)

    # hanging lamp: rod from the ceiling, a long green glass shade
    s.beam((2.0, HH, 2.65), (2.0, 1.55, 2.65), 0.025, (40, 36, 30))
    s.box(1.75, 2.25, 1.4, 1.55, 2.3, 3.0, (40, 96, 60))
    s.box(1.7, 2.3, 1.38, 1.42, 2.25, 3.05, (60, 130, 84), bias=0.2)
    s.box(1.8, 2.2, 1.36, 1.38, 2.35, 2.95, (230, 220, 170), bias=0.4)  # bulbs glowing faintly
    s.beam((2.2, 1.38, 2.4), (2.2, 1.12, 2.4), 0.012, (170, 150, 80), bias=0.5)  # pull chain
    s.box(2.185, 2.215, 1.08, 1.12, 2.385, 2.415, (190, 170, 90), bias=0.6)

    # cue rack on the x = R wall
    xw = R - 0.02
    s.box(xw - 0.06, xw, 0.35, 0.45, 1.0, 2.4, WOOD_DARK)
    s.box(xw - 0.06, xw, 1.5, 1.6, 1.0, 2.4, WOOD_DARK)
    for i in range(5):
        z = 1.15 + i * 0.27
        s.beam((xw - 0.08, 0.38, z), (xw - 0.08, 1.9, z), 0.03, (176, 140, 90), bias=0.5)
        s.beam((xw - 0.08, 0.38, z), (xw - 0.08, 0.6, z), 0.045, (60, 34, 22), bias=0.6)  # butts
    # chalk cubes on the rack's shelf
    for z in (1.3, 1.9):
        s.box(xw - 0.1, xw - 0.04, 1.6, 1.65, z, z + 0.06, (70, 110, 170), bias=0.7)
    # a small framed print above the table end on the far wall
    rr.wall_quad(s, "zR", 1.6, 2.4, 1.5, 2.0, (150, 120, 60), inset=0.003, bias=0.5)
    rr.wall_quad(s, "zR", 1.65, 2.35, 1.55, 1.95, (120, 120, 100), inset=0.005, bias=0.8)
    s.disc_on_wall((2.0, 1.75, R - 0.007), 0.08, (1, 0, 0), (0, 1, 0), (70, 52, 34), 8, bias=1)


def billiards_c(s):
    """Scoreboard over the liquor cabinet on the z = 0 wall; armchair, cigar box and the panelling on x = 0."""
    # liquor cabinet with glass doors
    cx0, cx1 = 1.0, 2.3
    s.box(cx0, cx1, 0, 0.1, 0.0, 0.48, WOOD_DARK)
    s.box(cx0, cx1, 0.1, 1.55, 0.0, 0.45, WOOD)
    s.box(cx0 - 0.04, cx1 + 0.04, 1.55, 1.62, 0.0, 0.5, (130, 86, 50))
    zf = 0.452
    for dx0 in (cx0 + 0.06, (cx0 + cx1) / 2 + 0.02):
        dx1 = dx0 + (cx1 - cx0) / 2 - 0.08
        rr.wall_quad(s, "z0", dx0, dx1, 0.5, 1.48, (140, 96, 56), inset=zf, bias=1)
        rr.wall_quad(s, "z0", dx0 + 0.05, dx1 - 0.05, 0.56, 1.42, (60, 72, 74), inset=zf + 0.002, bias=1.1)
        # decanters behind the glass
        for j in range(2):
            bx = dx0 + 0.13 + j * 0.24
            rr.wall_quad(s, "z0", bx, bx + 0.1, 0.6, 0.86, (120, 70, 30), inset=zf + 0.003, bias=1.2)
            rr.wall_quad(s, "z0", bx + 0.03, bx + 0.07, 0.86, 0.96, (120, 70, 30), inset=zf + 0.003, bias=1.2)
            rr.wall_quad(s, "z0", bx, bx + 0.1, 1.05, 1.28, (110, 120, 60), inset=zf + 0.003, bias=1.2)
        rr.wall_quad(s, "z0", dx0 + 0.05, dx1 - 0.05, 0.98, 1.0, (100, 70, 40), inset=zf + 0.004, bias=1.3)
    # brass lock plate with three ball sockets
    mx = (cx0 + cx1) / 2
    rr.wall_quad(s, "z0", mx - 0.2, mx + 0.2, 0.18, 0.42, (176, 146, 70), inset=zf, bias=1.4)
    for k in range(3):
        s.disc_on_wall((mx - 0.12 + k * 0.12, 0.3, zf + 0.004), 0.045, (1, 0, 0), (0, 1, 0), (30, 24, 16), 8, bias=1.6)

    # scoreboard above: a frame with bead wires and a chalk strip
    rr.wall_quad(s, "z0", 0.95, 2.35, 1.75, 2.4, (80, 50, 30), inset=0.004, bias=0.5)
    rr.wall_quad(s, "z0", 1.0, 2.3, 1.8, 2.35, (120, 84, 50), inset=0.006, bias=0.7)
    rng = random.Random(5)
    for row in range(3):
        y = 2.25 - row * 0.12
        rr.wall_quad(s, "z0", 1.02, 2.28, y, y + 0.01, (170, 150, 90), inset=0.008, bias=0.9)
        for b in range(rng.randint(4, 9)):
            bx = 1.06 + b * 0.07 + (0.5 if b > 5 else 0)
            s.disc_on_wall((bx, y + 0.005, 0.012), 0.025, (1, 0, 0), (0, 1, 0),
                           (200, 60, 50) if row % 2 else (220, 210, 190), 6, bias=1.0)
    rr.wall_quad(s, "z0", 1.06, 2.24, 1.84, 1.93, (36, 40, 38), inset=0.008, bias=0.9)
    for k in range(9):  # chalk letters
        x = 1.1 + k * 0.125
        rr.wall_quad(s, "z0", x, x + 0.07, 1.86, 1.91, (200, 200, 190), inset=0.01, bias=1.0)

    # armchair against the x = 0 wall
    leather, leather_dark = (120, 52, 32), (80, 34, 22)
    ax0, ax1, az0, az1 = 0.15, 0.95, 1.55, 2.35
    s.box(ax0, ax1, 0, 0.12, az0, az1, (40, 26, 18))
    s.box(ax0, ax1, 0.12, 0.42, az0, az1, leather_dark)
    s.box(ax0 + 0.1, ax1 - 0.02, 0.42, 0.52, az0 + 0.12, az1 - 0.12, leather, bias=0.4)  # seat cushion
    s.box(ax0 + 0.2, ax1 - 0.06, 0.52, 0.56, az0 + 0.3, az0 + 0.5, (140, 64, 40), bias=0.5)  # lump
    s.box(ax0, ax0 + 0.18, 0.42, 1.1, az0, az1, leather_dark)  # back
    for z in (az0, az1 - 0.14):  # arms
        s.box(ax0, ax1, 0.42, 0.68, z, z + 0.14, leather, bias=0.3)
    for k in range(3):  # buttons on the back
        s.box(ax0 + 0.18, ax0 + 0.2, 0.85, 0.88, az0 + 0.25 + k * 0.15, az0 + 0.28 + k * 0.15, (40, 20, 12), bias=0.6)

    # small side table with the cigar box
    tx, tz = 0.55, 2.75
    s.beam((tx, 0, tz), (tx, 0.58, tz), 0.06, WOOD_DARK)
    s.box(tx - 0.24, tx + 0.24, 0.0, 0.03, tz - 0.24, tz + 0.24, WOOD_DARK)
    s.box(tx - 0.28, tx + 0.28, 0.58, 0.62, tz - 0.28, tz + 0.28, WOOD)
    s.box(tx - 0.16, tx + 0.16, 0.62, 0.72, tz - 0.11, tz + 0.11, (150, 96, 54), bias=0.5)
    s.box(tx - 0.17, tx + 0.17, 0.72, 0.74, tz - 0.12, tz + 0.12, (170, 112, 64), bias=0.6)
    s.box(tx - 0.08, tx + 0.08, 0.66, 0.7, tz + 0.112, tz + 0.116, (210, 190, 120), bias=0.7)  # label

    # the panelling on the x = 0 wall: tall panels, one section you came through
    rr.wall_quad(s, "x0", 0.25, 1.15, 0.0, 2.25, (30, 18, 10), inset=0.003, bias=-37)  # a faint seam
    rr.wall_quad(s, "x0", 0.27, 1.13, 0.02, 2.23, (84, 52, 30), inset=0.004, bias=-36.5)
    for y0, y1 in ((0.15, 0.95), (1.15, 2.1)):
        rr.wall_quad(s, "x0", 0.37, 1.03, y0, y1, (100, 64, 36), inset=0.005, bias=-36)
    # a brass wall sconce, cold
    s.box(0.0, 0.08, 1.75, 1.85, 1.3, 1.4, (170, 140, 70), bias=0.5)
    s.box(0.04, 0.16, 1.85, 2.0, 1.27, 1.43, (220, 200, 150), bias=0.6)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), billiards_a],
    c=[lambda s: shell(s, ("z0", "x0")), billiards_c],
    light_a=(175, 95),
    light_c=(150, 120),
    light=rr.WARM,
)
