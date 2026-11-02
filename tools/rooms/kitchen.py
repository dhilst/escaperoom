"""The Kitchen: iron stove, stone sink and icebox (A); dresser, copper pots and the hall door (C)."""

import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT


def shell(s, far_walls):
    """Plaster walls over a tiled band, flagstone floor. Only the walls a camera faces get the
    tiles and stains, so the band on the walls beside the camera doesn't read as a fence."""
    rr.walls_floor(s, (88, 74, 60), (46, 38, 30), (100, 86, 68), (114, 100, 78))
    rng = random.Random(14)
    z = 0.0
    while z < R:
        d = rng.uniform(0.5, 0.75)
        x = -rng.uniform(0, 0.3)
        while x < R:
            w = rng.uniform(0.5, 0.9)
            g = rng.randint(-12, 10)
            x0, x1, z0, z1 = max(x, 0) + 0.02, min(x + w, R) - 0.02, z + 0.02, min(z + d, R) - 0.02
            s.quad([(x0, 0.002, z0), (x1, 0.002, z0), (x1, 0.002, z1), (x0, 0.002, z1)],
                   (96 + g, 82 + g, 66 + g), bias=-45)
            x += w
        z += d
    for wall in far_walls:
        rr.wall_quad(s, wall, 0, R, 0, 0.9, (84, 78, 66), inset=0.002, bias=-39)
        rr.wall_quad(s, wall, 0, R, 0.88, 0.94, (60, 44, 32), inset=0.003, bias=-38.5)
        u = 0.0
        while u < R:
            rr.wall_quad(s, wall, u, u + 0.012, 0, 0.88, (64, 58, 48), inset=0.003, bias=-38.6)
            u += 0.25
        for y in (0.3, 0.6):
            rr.wall_quad(s, wall, 0, R, y, y + 0.012, (64, 58, 48), inset=0.003, bias=-38.6)
        for _ in range(3):
            u, y, r = rng.uniform(0.5, 3.5), rng.uniform(1.4, 2.3), rng.uniform(0.15, 0.35)
            c = {"zR": (u, y, R - 0.002), "z0": (u, y, 0.002), "xR": (R - 0.002, y, u), "x0": (0.002, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, r, axis, (0, 0.6, 0), (82, 68, 54), 7, bias=-38)


def kitchen_a(s):
    """Iron stove + chimney pipe and stone sink on the z = R wall, icebox on the x = R wall."""
    iron, iron_dark = (74, 72, 70), (40, 38, 38)
    # stove body on short legs
    for lx in (0.95, 1.9):
        for lz in (R - 0.66, R - 0.12):
            s.box(lx, lx + 0.07, 0, 0.18, lz, lz + 0.07, iron_dark)
    s.box(0.9, 2.0, 0.18, 0.85, R - 0.7, R - 0.05, iron)
    s.box(0.86, 2.04, 0.85, 0.9, R - 0.74, R - 0.03, (90, 88, 84))  # cooktop
    # burners: dark rings with a lighter lid
    for bx in (1.2, 1.7):
        for bz in (R - 0.52, R - 0.24):
            s.disc_on_wall((bx, 0.903, bz), 0.15, (1, 0, 0), (0, 0, 1), (28, 26, 26), 10, bias=0.5)
            s.disc_on_wall((bx, 0.906, bz), 0.09, (1, 0, 0), (0, 0, 1), (60, 56, 54), 8, bias=0.6)
    # firebox door with a grate and oven door, both with brass handles
    zf = R - 0.702
    rr.wall_quad(s, "zR", 1.0, 1.4, 0.3, 0.75, (54, 52, 50), inset=0.702, bias=1)
    for k in range(4):
        x = 1.06 + k * 0.09
        rr.wall_quad(s, "zR", x, x + 0.04, 0.4, 0.62, (24, 22, 22), inset=0.706, bias=1.5)  # cold grate
    rr.wall_quad(s, "zR", 1.5, 1.92, 0.3, 0.75, (58, 56, 54), inset=0.702, bias=1)
    s.box(1.55, 1.87, 0.66, 0.7, zf - 0.04, zf, (180, 150, 70), bias=1.6)
    s.box(1.15, 1.25, 0.76, 0.8, zf - 0.04, zf, (180, 150, 70), bias=1.6)
    # back plate and chimney pipe up into the ceiling
    s.box(0.9, 2.0, 0.9, 1.25, R - 0.12, R - 0.04, iron)
    s.beam((1.45, 1.25, R - 0.12), (1.45, 1.9, R - 0.12), 0.2, (66, 64, 62))
    s.beam((1.45, 1.9, R - 0.12), (1.45, HH, R - 0.12), 0.2, (66, 64, 62))
    s.box(1.33, 1.57, 1.86, 1.94, R - 0.24, R - 0.0, (96, 94, 90), bias=0.3)  # pipe collar
    # a kettle on a burner
    s.box(1.6, 1.82, 0.91, 1.08, R - 0.36, R - 0.14, (60, 60, 64), bias=0.7)
    s.beam((1.82, 1.0, R - 0.25), (1.92, 1.1, R - 0.25), 0.035, (60, 60, 64), bias=0.7)

    # stone sink on a brick plinth
    stone = (150, 146, 134)
    s.box(2.4, 3.4, 0, 0.62, R - 0.62, R - 0.04, (120, 64, 48))
    for y in (0.15, 0.3, 0.45):
        rr.wall_quad(s, "zR", 2.4, 3.4, y, y + 0.015, (80, 50, 40), inset=0.622, bias=1)
    s.box(2.35, 3.45, 0.62, 0.86, R - 0.66, R - 0.02, stone)
    s.quad([(2.47, 0.862, R - 0.56), (3.33, 0.862, R - 0.56), (3.33, 0.862, R - 0.1), (2.47, 0.862, R - 0.1)],
           (70, 68, 62), bias=1)  # basin
    s.disc_on_wall((2.9, 0.864, R - 0.33), 0.04, (1, 0, 0), (0, 0, 1), (24, 22, 20), 6, bias=1.2)
    # pump tap
    s.beam((3.1, 0.86, R - 0.08), (3.1, 1.35, R - 0.08), 0.06, (70, 90, 80))
    s.beam((3.1, 1.3, R - 0.08), (3.1, 1.25, R - 0.3), 0.05, (70, 90, 80))
    s.beam((3.1, 1.35, R - 0.08), (3.3, 1.15, R - 0.08), 0.03, (70, 90, 80))
    # small window above the sink, black night
    rr.wall_quad(s, "zR", 2.55, 3.2, 1.45, 2.1, (70, 52, 36), inset=0.003, bias=0.5)
    rr.wall_quad(s, "zR", 2.6, 3.15, 1.5, 2.05, (20, 24, 36), inset=0.005, bias=1)
    rr.wall_quad(s, "zR", 2.865, 2.885, 1.5, 2.05, (70, 52, 36), inset=0.007, bias=1.5)
    rr.wall_quad(s, "zR", 2.6, 3.15, 1.765, 1.785, (70, 52, 36), inset=0.007, bias=1.5)

    # white enamel icebox against the x = R wall
    white = (204, 202, 192)
    x0 = R - 0.62
    s.box(x0, R - 0.02, 0, 0.12, 1.85, 2.85, (60, 56, 50))  # feet/plinth
    s.box(x0, R - 0.02, 0.12, 1.6, 1.85, 2.85, white)
    xf = x0 - 0.004
    # two doors: upper ice compartment, lower larder
    for (y0, y1) in ((0.95, 1.52), (0.2, 0.88)):
        s.quad([(xf, y0, 1.92), (xf, y0, 2.78), (xf, y1, 2.78), (xf, y1, 1.92)], (176, 174, 166), bias=1)
        s.quad([(xf - 0.002, y0 + 0.05, 1.97), (xf - 0.002, y0 + 0.05, 2.73), (xf - 0.002, y1 - 0.05, 2.73),
                (xf - 0.002, y1 - 0.05, 1.97)], (214, 212, 204), bias=1.2)
    for yh in (1.2, 0.55):  # chrome latches
        s.box(xf - 0.06, xf, yh - 0.04, yh + 0.08, 2.0, 2.08, (150, 150, 150), bias=1.5)
    # frost round the upper latch
    s.quad([(xf - 0.004, 1.12, 1.94), (xf - 0.004, 1.12, 2.16), (xf - 0.004, 1.3, 2.16),
            (xf - 0.004, 1.3, 1.94)], (190, 210, 220), bias=1.4)
    s.box(x0 - 0.02, R - 0.02, 1.6, 1.66, 1.83, 2.87, (150, 148, 140))  # lid rim
    # a puddle of meltwater
    s.quad([(x0 - 0.35, 0.004, 2.0), (x0, 0.004, 1.9), (x0, 0.004, 2.7), (x0 - 0.25, 0.004, 2.5)],
           (60, 70, 76), bias=-43)


def kitchen_c(s):
    """Dresser with drawers and a copper pot rack on the z = 0 wall, hall door on the x = 0 wall."""
    wood, wood_dark = (96, 62, 38), (62, 40, 26)
    # dresser: lower cabinet with drawers, plate rack above
    s.box(0.95, 2.55, 0, 1.0, 0.0, 0.55, wood)
    s.box(0.9, 2.6, 1.0, 1.06, 0.0, 0.6, (136, 92, 56))  # worktop
    zf = 0.552
    for i in range(3):  # three drawers across the top
        x = 1.02 + i * 0.5
        rr.wall_quad(s, "z0", x - 0.01, x + 0.47, 0.71, 0.95, (30, 20, 14), inset=zf, bias=0.9)
        rr.wall_quad(s, "z0", x, x + 0.46, 0.72, 0.94, (150, 104, 64), inset=zf + 0.002, bias=1)
        s.box(x + 0.19, x + 0.27, 0.8, 0.86, zf, zf + 0.05, (190, 160, 80), bias=1.5)
    # the middle one hangs slightly open
    s.box(1.52, 1.98, 0.72, 0.94, zf, zf + 0.1, (150, 104, 64), bias=1.2)
    s.box(1.71, 1.79, 0.8, 0.86, zf + 0.1, zf + 0.15, (190, 160, 80), bias=1.7)
    for x0 in (1.02, 1.79):  # cupboard doors below
        rr.wall_quad(s, "z0", x0, x0 + 0.72, 0.08, 0.66, wood_dark, inset=zf, bias=1)
        rr.wall_quad(s, "z0", x0 + 0.06, x0 + 0.66, 0.14, 0.6, (110, 72, 44), inset=zf + 0.002, bias=1.2)
    # plate rack above the worktop
    s.box(0.95, 2.55, 1.06, 1.62, 0.0, 0.18, wood_dark)
    for y in (1.26, 1.59):
        s.box(0.95, 2.55, y, y + 0.03, 0.0, 0.24, wood)
    for i in range(6):
        x = 1.12 + i * 0.25
        s.disc_on_wall((x, 1.42, 0.19), 0.1, (1, 0, 0), (0, 1, 0), (196, 196, 184), 8, bias=1.4)
        s.disc_on_wall((x, 1.42, 0.192), 0.05, (1, 0, 0), (0, 1, 0), (80, 100, 140), 6, bias=1.5)
    # copper pots hanging from a rail above the dresser
    s.beam((0.9, 2.35, 0.32), (2.6, 2.35, 0.32), 0.04, (50, 46, 42))
    for x in (0.95, 2.55):
        s.beam((x, 2.35, 0.32), (x, 2.35, 0.0), 0.03, (50, 46, 42))
    copper = (190, 104, 56)
    for i, (x, r, drop) in enumerate(((1.1, 0.13, 0.14), (1.5, 0.1, 0.12), (1.9, 0.14, 0.16), (2.3, 0.11, 0.12))):
        y = 2.35 - drop
        s.beam((x, 2.35, 0.32), (x, y, 0.32), 0.015, (60, 56, 50), bias=0.3)
        s.box(x - r, x + r, y - r * 1.6, y, 0.32 - r, 0.32 + r, copper, bias=0.4)
        s.box(x - r - 0.02, x + r + 0.02, y - 0.03, y, 0.3 - r, 0.34 + r, (210, 130, 70), bias=0.5)
        s.beam((x + r, y - r * 0.6, 0.32), (x + r + 0.18, y - r * 0.6, 0.32), 0.03, (120, 70, 40), bias=0.5)

    # heavy oak door to the hall on the x = 0 wall
    rr.wall_quad(s, "x0", 1.3, 2.5, 0, 2.2, (56, 38, 26), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.38, 2.42, 0, 2.12, (112, 74, 44), inset=0.006, bias=1)
    for z in (1.62, 1.9, 2.18):  # planks
        rr.wall_quad(s, "x0", z, z + 0.015, 0, 2.12, (76, 50, 30), inset=0.008, bias=1.2)
    for y in (0.35, 1.75):  # iron straps
        rr.wall_quad(s, "x0", 1.38, 2.42, y, y + 0.08, (46, 44, 42), inset=0.009, bias=1.4)
    # big iron lock plate with keyhole
    s.box(0.006, 0.05, 0.9, 1.2, 2.18, 2.36, (54, 52, 50), bias=1.5)
    rr.wall_quad(s, "x0", 2.25, 2.29, 0.98, 1.08, (12, 10, 8), inset=0.052, bias=2)
    s.box(0.006, 0.09, 1.12, 1.17, 2.0, 2.2, (150, 130, 70), bias=1.6)  # handle
    # a strip of cold light under the door
    s.quad([(0.006, 0.003, 1.38), (0.006, 0.003, 2.42), (0.15, 0.003, 2.36), (0.15, 0.003, 1.44)],
           (90, 92, 100), bias=-43)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), kitchen_a],
    c=[lambda s: shell(s, ("z0", "x0")), kitchen_c],
    light_a=(110, 150),
    light_c=(150, 110),
    light=rr.WARM,
)
