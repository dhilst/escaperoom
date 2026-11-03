"""The Bathroom: clawfoot tub under a copper geyser, washbasin and cracked mirror (A);
toilet with a high cistern, medicine cabinet, towel rail, bathrobe, gas lamp and the door (C)."""

import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
TILE_TOP = 1.3


def shell(s, far_walls):
    """Green-grey plaster over a band of white tiles, checkered floor."""
    rr.walls_floor(s, (136, 134, 126), (70, 74, 70), (112, 126, 116), (128, 142, 130))
    for i in range(10):  # checkered floor
        for j in range(10):
            if (i + j) % 2:
                x0, z0 = i * R / 10, j * R / 10
                s.quad([(x0, 0.002, z0), (x0 + R / 10, 0.002, z0), (x0 + R / 10, 0.002, z0 + R / 10),
                        (x0, 0.002, z0 + R / 10)], (40, 42, 44), bias=-45)
    rng = random.Random(23)
    for wall in far_walls:
        rr.wall_quad(s, wall, 0, R, 0, TILE_TOP, (176, 178, 168), inset=0.002, bias=-39)
        rr.wall_quad(s, wall, 0, R, TILE_TOP, TILE_TOP + 0.06, (60, 92, 80), inset=0.003, bias=-38.5)
        u = 0.0
        while u < R:  # grout grid
            rr.wall_quad(s, wall, u, u + 0.012, 0, TILE_TOP, (120, 122, 114), inset=0.003, bias=-38.6)
            u += 0.2
        y = 0.2
        while y < TILE_TOP:
            rr.wall_quad(s, wall, 0, R, y, y + 0.012, (120, 122, 114), inset=0.003, bias=-38.6)
            y += 0.2
        for _ in range(4):  # damp stains on the plaster
            u, y, r = rng.uniform(0.4, 3.6), rng.uniform(1.7, 2.4), rng.uniform(0.12, 0.3)
            c = {"zR": (u, y, R - 0.002), "z0": (u, y, 0.002), "xR": (R - 0.002, y, u), "x0": (0.002, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, r, axis, (0, 0.6, 0), (78, 88, 74), 7, bias=-38)


def bathroom_a(s):
    """Clawfoot tub and copper geyser on the z = R wall, washbasin and mirror on the x = R wall."""
    enamel, rim = (210, 208, 198), (230, 228, 220)
    brass, copper = (190, 160, 80), (184, 104, 58)
    x0, x1, z0, z1 = 0.45, 2.25, R - 0.82, R - 0.06
    # claw feet
    for fx in (x0 + 0.1, x1 - 0.18):
        for fz in (z0 + 0.08, z1 - 0.16):
            s.box(fx, fx + 0.08, 0, 0.14, fz, fz + 0.08, brass)
    s.box(x0, x1, 0.14, 0.62, z0, z1, enamel)
    s.box(x0 - 0.03, x1 + 0.03, 0.62, 0.67, z0 - 0.03, z1 + 0.02, rim, bias=0.3)
    # grey water inside
    s.quad([(x0 + 0.06, 0.672, z0 + 0.06), (x1 - 0.06, 0.672, z0 + 0.06), (x1 - 0.06, 0.672, z1 - 0.06),
            (x0 + 0.06, 0.672, z1 - 0.06)], (92, 98, 92), bias=0.6)
    for k in range(3):  # scum on the surface
        cx = x0 + 0.4 + k * 0.45
        s.disc_on_wall((cx, 0.675, z0 + 0.35 + 0.08 * k), 0.12, (1, 0, 0), (0, 0, 1), (112, 112, 98), 7, bias=0.8)
    # plug chain over the rim
    s.beam((x0 + 0.5, 0.67, z0 + 0.02), (x0 + 0.5, 0.4, z0 - 0.04), 0.018, (170, 170, 160), bias=1)
    s.beam((x0 + 0.5, 0.67, z0 + 0.02), (x0 + 0.55, 0.675, z0 + 0.3), 0.018, (170, 170, 160), bias=1)
    # taps on the wall at the tub's right end
    for i, (tx, col) in enumerate(((1.85, (200, 70, 60)), (2.08, (70, 110, 200)))):
        s.beam((tx, 0.82, R - 0.01), (tx, 0.82, R - 0.16), 0.04, brass, bias=1)
        s.beam((tx, 0.82, R - 0.16), (tx, 0.72, R - 0.16), 0.035, brass, bias=1)
        s.box(tx - 0.06, tx + 0.06, 0.86, 0.9, R - 0.12, R - 0.06, brass, bias=1.2)
        s.box(tx - 0.025, tx + 0.025, 0.9, 0.93, R - 0.1, R - 0.08, col, bias=1.4)
    # copper geyser above the taps, with its flue up into the ceiling
    gx0, gx1 = 1.7, 2.25
    s.box(gx0, gx1, 1.45, 2.15, R - 0.36, R - 0.02, copper)
    s.box(gx0 - 0.02, gx1 + 0.02, 2.12, 2.2, R - 0.38, R - 0.0, (150, 84, 48), bias=0.4)
    s.box(gx0 - 0.02, gx1 + 0.02, 1.42, 1.48, R - 0.38, R - 0.0, (150, 84, 48), bias=0.4)
    s.box(gx0 - 0.005, gx1 + 0.005, 1.86, 1.89, R - 0.365, R - 0.02, (210, 140, 80), bias=0.5)  # band
    # little mica window for the pilot, dark
    rr.wall_quad(s, "zR", 1.88, 2.06, 1.52, 1.62, (30, 26, 22), inset=0.362, bias=1)
    s.beam(((gx0 + gx1) / 2, 2.2, R - 0.2), ((gx0 + gx1) / 2, HH, R - 0.2), 0.12, (120, 70, 40))
    s.beam((1.98, 1.45, R - 0.2), (1.98, 0.95, R - 0.2), 0.05, copper)  # pipe down to the hot tap
    s.beam((1.98, 0.95, R - 0.2), (1.85, 0.82, R - 0.08), 0.05, copper)
    # gas pipe along the wall
    s.beam((gx1 + 0.05, 1.5, R - 0.05), (R - 0.03, 1.5, R - 0.05), 0.03, (90, 90, 86))

    # pedestal washbasin on the x = R wall
    bz0, bz1 = 2.0, 2.75
    s.box(R - 0.35, R - 0.18, 0, 0.72, 2.28, 2.47, enamel)
    s.box(R - 0.55, R - 0.01, 0.72, 0.86, bz0, bz1, enamel)
    s.box(R - 0.57, R - 0.01, 0.86, 0.89, bz0 - 0.02, bz1 + 0.02, rim, bias=0.3)
    s.quad([(R - 0.5, 0.892, bz0 + 0.07), (R - 0.5, 0.892, bz1 - 0.07), (R - 0.07, 0.892, bz1 - 0.07),
            (R - 0.07, 0.892, bz0 + 0.07)], (150, 150, 142), bias=0.6)
    s.beam((R - 0.03, 1.0, 2.375), (R - 0.15, 1.0, 2.375), 0.04, brass, bias=1)
    s.box(R - 0.45, R - 0.35, 0.89, 0.92, 2.55, 2.66, (200, 190, 150), bias=0.8)  # soap
    # mirror above the basin, with a crack
    rr.wall_quad(s, "xR", 1.95, 2.8, 1.25, 2.15, (110, 90, 60), inset=0.004, bias=0.5)
    rr.wall_quad(s, "xR", 2.0, 2.75, 1.3, 2.1, (150, 170, 176), inset=0.006, bias=1)
    rr.wall_quad(s, "xR", 2.0, 2.4, 1.3, 1.7, (128, 150, 158), inset=0.007, bias=1.1)  # reflection shade
    s.beam((R - 0.009, 2.05, 2.2), (R - 0.009, 1.6, 2.45), 0.01, (60, 60, 60), bias=1.5)
    s.beam((R - 0.009, 1.6, 2.45), (R - 0.009, 1.35, 2.38), 0.01, (60, 60, 60), bias=1.5)


def bathroom_c(s):
    """Toilet, cistern, medicine cabinet and towel rail on the z = 0 wall; door, robe and gas lamp on x = 0."""
    porcelain, wood = (206, 204, 194), (92, 60, 36)
    # toilet bowl and seat
    s.box(1.0, 1.3, 0, 0.12, 0.16, 0.56, porcelain)  # pedestal
    s.box(0.92, 1.38, 0.12, 0.4, 0.06, 0.7, porcelain)
    s.box(0.9, 1.4, 0.4, 0.44, 0.04, 0.72, (120, 84, 52), bias=0.3)  # wooden seat
    s.box(0.93, 1.37, 0.44, 0.47, 0.06, 0.69, (140, 98, 60), bias=0.4)  # closed lid
    # high cistern with its flush pipe and pull chain
    s.box(0.82, 1.48, 1.95, 2.28, 0.0, 0.26, (44, 46, 48))
    s.box(0.8, 1.5, 2.28, 2.32, 0.0, 0.28, (80, 84, 80), bias=0.3)
    s.beam((1.15, 1.95, 0.12), (1.15, 0.42, 0.12), 0.05, (150, 150, 140))
    s.beam((1.42, 1.95, 0.24), (1.42, 1.25, 0.26), 0.012, (170, 170, 160), bias=0.6)
    s.box(1.39, 1.45, 1.17, 1.25, 0.23, 0.29, (200, 196, 180), bias=0.8)  # handle
    # medicine cabinet with brass dials
    cx0, cx1 = 1.75, 2.35
    s.box(cx0, cx1, 1.35, 1.95, 0.0, 0.18, (196, 200, 192))
    rr.wall_quad(s, "z0", cx0 + 0.05, cx1 - 0.05, 1.4, 1.9, (172, 178, 170), inset=0.182, bias=1)
    rr.wall_quad(s, "z0", cx0 + 0.08, cx1 - 0.08, 1.6, 1.87, (130, 150, 156), inset=0.184, bias=1.2)  # mirror front
    for k in range(4):
        x = cx0 + 0.13 + k * 0.1
        s.disc_on_wall((x, 1.49, 0.186), 0.035, (1, 0, 0), (0, 1, 0), (200, 170, 80), 8, bias=1.4)
    # towel rail with grey towels
    s.beam((2.7, 1.15, 0.12), (3.55, 1.15, 0.12), 0.03, (190, 160, 80))
    for x in (2.72, 3.53):
        s.beam((x, 1.15, 0.12), (x, 1.15, 0.0), 0.025, (190, 160, 80))
    s.box(2.8, 3.1, 0.7, 1.17, 0.09, 0.16, (176, 176, 164), bias=0.4)
    s.box(3.15, 3.45, 0.8, 1.17, 0.09, 0.16, (150, 156, 148), bias=0.4)

    # narrow door on the x = 0 wall
    rr.wall_quad(s, "x0", 1.45, 2.35, 0, 2.1, (50, 34, 24), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.52, 2.28, 0, 2.03, (118, 82, 52), inset=0.006, bias=1)
    for y0, y1 in ((0.15, 0.9), (1.1, 1.9)):
        rr.wall_quad(s, "x0", 1.6, 2.2, y0, y1, (100, 68, 42), inset=0.008, bias=1.2)
    s.box(0.006, 0.05, 0.9, 1.15, 2.08, 2.2, (150, 80, 40), bias=1.5)  # rusty lock plate
    rr.wall_quad(s, "x0", 2.12, 2.16, 0.95, 1.04, (14, 10, 8), inset=0.052, bias=2)
    s.box(0.006, 0.09, 1.08, 1.12, 2.15, 2.25, (170, 140, 70), bias=1.6)  # knob
    # bathrobe on a hook beside the door
    s.box(0.006, 0.06, 1.78, 1.84, 2.62, 2.68, (190, 160, 80), bias=1)
    s.box(0.03, 0.22, 0.75, 1.8, 2.45, 2.85, (150, 70, 70), bias=1.2)
    s.box(0.2, 0.235, 1.0, 1.25, 2.55, 2.75, (120, 52, 52), bias=1.5)  # the heavy pocket
    s.beam((0.22, 1.35, 2.47), (0.22, 1.35, 2.83), 0.03, (110, 48, 48), bias=1.6)  # belt
    # gas lamp on the other side of the door
    s.box(0.005, 0.03, 1.5, 1.75, 1.05, 1.25, (190, 160, 80), bias=0.9)  # back plate
    s.beam((0.02, 1.62, 1.15), (0.3, 1.62, 1.15), 0.04, (190, 160, 80), bias=1)  # arm
    s.box(0.2, 0.42, 1.66, 1.98, 1.04, 1.26, (176, 190, 180), bias=1.2)  # glass globe
    s.box(0.26, 0.36, 1.72, 1.86, 1.1, 1.2, (230, 230, 214), bias=1.4)  # mantle
    s.box(0.18, 0.44, 1.98, 2.03, 1.02, 1.28, (190, 160, 80), bias=1.3)
    s.box(0.18, 0.44, 1.62, 1.66, 1.02, 1.28, (190, 160, 80), bias=1.3)
    s.beam((0.01, 0.9, 1.15), (0.01, 1.5, 1.15), 0.03, (110, 110, 104), bias=0.8)  # gas pipe
    # bathmat
    s.quad([(2.4, 0.004, 1.2), (3.2, 0.004, 1.2), (3.2, 0.004, 1.7), (2.4, 0.004, 1.7)], (90, 110, 96), bias=-43)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), bathroom_a],
    c=[lambda s: shell(s, ("z0", "x0")), bathroom_c],
    light_a=(150, 110),
    light_c=(160, 100),
    light=rr.COLD,
)
