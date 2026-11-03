"""The Darkroom: workbench with the enlarger, two trays, the card and a timer; safelight and taped
switch on the side wall (A); supply cabinet, deep sink, a drying line of prints and the dial-lock door (C)."""

import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
# Everything in here is seen by the red safelight.
SAFELIGHT = ((0.75, 0.22, 0.16), (26, 2, 0))


def shell(s, far_walls):
    """Matte black-green walls over a lino floor; a dark skirting band on the walls the camera faces."""
    rr.walls_floor(s, (70, 66, 62), (34, 32, 32), (78, 78, 74), (92, 92, 86))
    for k in range(8):  # checkered lino
        for j in range(8):
            if (k + j) % 2:
                x0, z0 = k * R / 8, j * R / 8
                s.quad([(x0, 0.002, z0), (x0 + R / 8, 0.002, z0), (x0 + R / 8, 0.002, z0 + R / 8), (x0, 0.002, z0 + R / 8)],
                       (54, 50, 48), bias=-45)
    rng = random.Random(18)
    for wall in far_walls:
        rr.wall_quad(s, wall, 0, R, 0, 0.12, (40, 38, 36), inset=0.002, bias=-39)
        for _ in range(4):  # chemical stains
            u, y = rng.uniform(0.4, 3.6), rng.uniform(0.3, 2.2)
            c = {"zR": (u, y, R - 0.002), "z0": (u, y, 0.002), "xR": (R - 0.002, y, u), "x0": (0.002, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, rng.uniform(0.12, 0.3), axis, (0, 0.7, 0), (70, 72, 64), 7, bias=-38)


def darkroom_a(s):
    """Bench, enlarger, trays, card and timer on the z = R wall; safelight and switch on the x = R wall."""
    wood, wood_dark = (104, 76, 50), (64, 46, 32)
    # the workbench: a slab on legs, a drawer under the trays
    s.box(0.6, 3.45, 0.86, 0.92, R - 0.7, R - 0.02, (120, 96, 66))
    for lx in (0.64, 3.36):
        for lz in (R - 0.66, R - 0.1):
            s.box(lx, lx + 0.06, 0, 0.86, lz, lz + 0.06, wood_dark)
    s.box(0.6, 3.45, 0.66, 0.86, R - 0.66, R - 0.04, wood)  # apron
    zf = R - 0.662
    rr.wall_quad(s, "zR", 2.05, 2.95, 0.69, 0.83, (40, 28, 20), inset=0.662, bias=1)  # drawer gap
    rr.wall_quad(s, "zR", 2.07, 2.93, 0.7, 0.82, (130, 96, 62), inset=0.664, bias=1.1)
    s.box(2.44, 2.56, 0.74, 0.78, zf - 0.04, zf, (180, 160, 90), bias=1.5)  # knob
    s.box(0.6, 3.45, 0.12, 0.16, R - 0.66, R - 0.06, wood_dark)  # low shelf
    for i, x in enumerate((0.8, 1.05, 2.3, 2.6, 3.0)):  # jugs on the shelf
        c = ((90, 60, 30), (60, 70, 40), (110, 110, 100), (80, 50, 30), (60, 64, 70))[i]
        s.box(x, x + 0.16, 0.16, 0.42, R - 0.4, R - 0.24, c, bias=0.3)

    # the enlarger: baseboard, steel column, lamp head and bellows
    s.box(0.75, 1.5, 0.92, 0.96, R - 0.62, R - 0.12, (150, 146, 134), bias=0.2)  # easel
    s.box(0.82, 1.43, 0.962, 0.966, R - 0.55, R - 0.2, (196, 196, 186), bias=0.3)  # white easel mask
    s.beam((1.42, 0.96, R - 0.1), (1.42, 2.15, R - 0.1), 0.1, (176, 176, 182))
    s.box(1.3, 1.46, 1.68, 1.76, R - 0.3, R - 0.08, (150, 150, 156), bias=0.3)  # arm
    s.box(0.88, 1.36, 1.55, 1.86, R - 0.5, R - 0.16, (86, 86, 92), bias=0.4)  # lamp head
    s.box(0.95, 1.29, 1.86, 1.96, R - 0.44, R - 0.22, (100, 100, 106), bias=0.4)
    s.box(0.96, 1.28, 1.36, 1.55, R - 0.46, R - 0.2, (30, 30, 30), bias=0.45)  # bellows
    s.box(1.04, 1.2, 1.22, 1.36, R - 0.4, R - 0.26, (90, 90, 96), bias=0.5)  # lens
    s.box(1.07, 1.17, 1.6, 1.64, R - 0.52, R - 0.5, (150, 150, 150), bias=0.6)  # carrier handle
    # the exposure timer
    s.box(1.55, 1.78, 0.92, 1.12, R - 0.4, R - 0.24, (40, 40, 44), bias=0.4)
    s.disc_on_wall((1.665, 1.02, R - 0.405), 0.07, (1, 0, 0), (0, 1, 0), (200, 196, 180), 10, bias=0.6)
    s.beam((1.665, 1.02, R - 0.41), (1.7, 1.07, R - 0.41), 0.01, (160, 30, 30), bias=0.7)

    # two trays: developer (brown) and fixer (green-grey)
    for x0, liquid in ((1.9, (96, 70, 40)), (2.6, (70, 84, 72))):
        s.box(x0, x0 + 0.58, 0.92, 0.99, R - 0.6, R - 0.18, (180, 180, 170), bias=0.4)
        s.quad([(x0 + 0.04, 0.985, R - 0.56), (x0 + 0.54, 0.985, R - 0.56), (x0 + 0.54, 0.985, R - 0.22),
                (x0 + 0.04, 0.985, R - 0.22)], liquid, bias=0.6)
    s.box(2.0, 2.06, 0.99, 1.0, R - 0.5, R - 0.3, (190, 190, 180), bias=0.7)  # tongs
    # bottles against the wall
    for x, c in ((2.0, (60, 40, 24)), (2.2, (60, 40, 24)), (2.9, (40, 56, 48)), (3.1, (40, 56, 48))):
        s.box(x, x + 0.12, 0.92, 1.2, R - 0.14, R - 0.04, c, bias=0.3)
        s.box(x + 0.03, x + 0.09, 1.2, 1.26, R - 0.12, R - 0.06, (30, 30, 30), bias=0.35)

    # the card pinned above the trays
    rr.wall_quad(s, "zR", 2.3, 2.85, 1.38, 1.72, (214, 208, 190), inset=0.004, bias=0.5)
    for k in range(4):
        y = 1.62 - k * 0.07
        rr.wall_quad(s, "zR", 2.36, 2.79 - (k % 2) * 0.12, y, y + 0.025, (40, 36, 34), inset=0.006, bias=0.7)
    s.box(2.56, 2.59, 1.68, 1.71, R - 0.02, R - 0.006, (180, 30, 30), bias=0.8)  # pin

    # the safelight: a black hood on a bracket, its dark red glass facing the room
    xw = R - 0.004
    s.box(R - 0.2, xw, 2.04, 2.1, 2.62, 2.68, (40, 40, 40))  # bracket
    s.box(R - 0.46, R - 0.16, 1.82, 2.12, 2.48, 2.82, (30, 30, 32), bias=0.4)
    s.quad([(R - 0.462, 1.86, 2.52), (R - 0.462, 1.86, 2.78), (R - 0.462, 2.08, 2.78), (R - 0.462, 2.08, 2.52)],
           (120, 24, 20), bias=0.8)
    s.beam((R - 0.1, 2.1, 2.65), (R - 0.1, HH, 2.65), 0.02, (20, 20, 20))  # cable
    # the taped-down switch
    s.box(R - 0.03, xw, 1.25, 1.45, 1.55, 1.7, (190, 186, 172), bias=0.5)
    s.box(R - 0.05, R - 0.03, 1.27, 1.43, 1.57, 1.68, (200, 180, 90), bias=0.7)  # tape
    s.beam((R - 0.02, 1.45, 1.625), (R - 0.02, HH, 1.625), 0.015, (40, 40, 40))
    # a black-out curtain bunched in the corner
    for k in range(5):
        z = 0.5 + k * 0.12
        s.box(R - 0.12 - (k % 2) * 0.04, R - 0.01, 0, HH - 0.1, z, z + 0.12, (30 + 6 * (k % 2), 30, 34), bias=0.2)


def darkroom_c(s):
    """Sink and supply cabinet on the z = 0 wall, the drying line above, the dial-lock door on x = 0."""
    # the deep sink on a frame, with a tap
    s.box(0.7, 2.1, 0.0, 0.8, 0.02, 0.62, (60, 60, 64))
    s.box(0.65, 2.15, 0.8, 0.9, 0.0, 0.66, (150, 150, 146))
    s.quad([(0.75, 0.902, 0.06), (2.05, 0.902, 0.06), (2.05, 0.902, 0.6), (0.75, 0.902, 0.6)], (50, 54, 56), bias=0.5)
    s.quad([(0.85, 0.904, 0.14), (1.95, 0.904, 0.14), (1.95, 0.904, 0.52), (0.85, 0.904, 0.52)], (76, 70, 60), bias=0.6)
    s.beam((1.4, 0.9, 0.05), (1.4, 1.3, 0.05), 0.05, (150, 150, 156))
    s.beam((1.4, 1.3, 0.05), (1.4, 1.26, 0.28), 0.04, (150, 150, 156))
    s.box(1.33, 1.47, 1.32, 1.36, 0.02, 0.1, (180, 40, 40), bias=0.5)  # tap handle
    # the tall supply cabinet
    wood = (92, 70, 52)
    s.box(2.45, 3.45, 0.0, 2.05, 0.0, 0.55, wood)
    zf = 0.552
    for x0 in (2.5, 2.97):
        rr.wall_quad(s, "z0", x0, x0 + 0.44, 0.1, 1.95, (60, 44, 32), inset=zf, bias=1)
        rr.wall_quad(s, "z0", x0 + 0.05, x0 + 0.39, 0.16, 1.89, (110, 84, 62), inset=zf + 0.002, bias=1.1)
    s.box(2.92, 3.0, 0.95, 1.15, zf, zf + 0.05, (170, 160, 120), bias=1.5)  # latch
    s.box(2.4, 3.5, 2.05, 2.1, 0.0, 0.6, (70, 52, 38))
    s.box(2.6, 2.9, 2.1, 2.24, 0.1, 0.4, (180, 170, 130), bias=0.3)  # a paper box on top

    # the drying line with old prints pegged to it
    s.beam((0.05, 1.98, 0.85), (2.45, 1.98, 0.85), 0.012, (200, 200, 190), bias=2)
    rng = random.Random(5)
    for k in range(7):
        x = 0.35 + k * 0.32
        if 2.3 < x < 2.5:
            continue
        top = 1.97
        w, h = rng.uniform(0.2, 0.25), rng.uniform(0.26, 0.32)
        tone = rng.randint(150, 200)
        s.quad([(x, top - h, 0.85), (x + w, top - h, 0.85), (x + w, top, 0.85), (x, top, 0.85)],
               (tone, tone - 6, tone - 14), bias=2.5)
        s.quad([(x + 0.02, top - h + 0.02, 0.852), (x + w - 0.02, top - h + 0.02, 0.852), (x + w - 0.02, top - 0.02, 0.852),
                (x + 0.02, top - 0.02, 0.852)], (tone - 70, tone - 76, tone - 80), bias=2.6)
        s.disc_on_wall((x + w / 2, top - h / 2 + 0.02, 0.854), 0.055, (1, 0, 0), (0, 1.25, 0), (tone - 20, tone - 26, tone - 34), 8,
                       bias=2.7)  # a face
        s.box(x + w / 2 - 0.015, x + w / 2 + 0.015, top - 0.03, top + 0.04, 0.84, 0.86, (140, 110, 70), bias=2.8)  # peg

    # the light-tight door with a safe-style dial on the x = 0 wall
    rr.wall_quad(s, "x0", 1.3, 2.5, 0, 2.2, (36, 36, 38), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.38, 2.42, 0, 2.12, (70, 72, 76), inset=0.006, bias=1)
    rr.wall_quad(s, "x0", 1.5, 2.3, 1.3, 1.9, (60, 62, 66), inset=0.008, bias=1.2)
    rr.wall_quad(s, "x0", 1.5, 2.3, 0.2, 1.0, (60, 62, 66), inset=0.008, bias=1.2)
    s.disc_on_wall((0.03, 1.15, 2.22), 0.12, (0, 0, 1), (0, 1, 0), (170, 170, 160), 12, bias=1.6)  # dial
    s.disc_on_wall((0.034, 1.15, 2.22), 0.07, (0, 0, 1), (0, 1, 0), (60, 60, 60), 10, bias=1.7)
    s.box(0.03, 0.04, 1.25, 1.3, 2.2, 2.24, (190, 40, 40), bias=1.8)  # dial mark
    s.box(0.006, 0.09, 1.0, 1.04, 1.58, 1.8, (150, 150, 150), bias=1.6)  # handle
    rr.wall_quad(s, "x0", 2.1, 2.36, 1.42, 1.48, (220, 220, 210), inset=0.01, bias=1.7)  # chalk marks
    rr.wall_quad(s, "x0", 2.14, 2.34, 1.36, 1.4, (220, 220, 210), inset=0.01, bias=1.7)
    # a thin strip of light under the door
    s.quad([(0.006, 0.003, 1.38), (0.006, 0.003, 2.42), (0.16, 0.003, 2.36), (0.16, 0.003, 1.44)],
           (130, 126, 110), bias=-43)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), darkroom_a],
    c=[lambda s: shell(s, ("z0", "x0")), darkroom_c],
    light_a=(250, 70),
    light_c=(160, 110),
    light=SAFELIGHT,
)
