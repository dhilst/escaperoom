"""The Portrait Gallery: four ancestors with brass plaques, gas sconces, a marble bust by a tall
window (A); the lady's large crooked portrait over a velvet bench, a gas pipe and valve (C)."""

import random

import render_rooms as rr

R, H = rr.ROOM, rr.HEIGHT
GILT, GILT_DARK = (186, 150, 64), (120, 92, 40)
GAS = ((0.62, 0.50, 0.26), (14, 8, 0))


def shell(s, far_walls):
    """Oxblood damask above dark wainscot panels, parquet floor, a long runner rug."""
    rr.walls_floor(s, (96, 66, 44), (44, 34, 30), (104, 44, 44), (124, 54, 52))
    rng = random.Random(23)
    # parquet strips
    for k in range(1, 14):
        z = R * k / 14
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], (70, 46, 30), bias=-45)
    # runner rug down the middle of the room, diagonal to both cameras
    s.quad([(0.9, 0.003, 0.9), (3.1, 0.003, 0.9), (3.1, 0.003, 3.1), (0.9, 0.003, 3.1)], (60, 30, 50), bias=-44)
    s.quad([(1.05, 0.004, 1.05), (2.95, 0.004, 1.05), (2.95, 0.004, 2.95), (1.05, 0.004, 2.95)], (92, 46, 70), bias=-43)
    s.quad([(1.25, 0.005, 1.25), (2.75, 0.005, 1.25), (2.75, 0.005, 2.75), (1.25, 0.005, 2.75)], (70, 36, 56), bias=-42)
    for wall in far_walls:
        # wainscot: dark wood up to the dado rail, with raised panels
        rr.wall_quad(s, wall, 0, R, 0, 0.95, (70, 44, 28), inset=0.002, bias=-39)
        rr.wall_quad(s, wall, 0, R, 0.92, 0.98, (110, 74, 44), inset=0.004, bias=-38.5)
        u = 0.1
        while u < R - 0.3:
            rr.wall_quad(s, wall, u, u + 0.5, 0.15, 0.8, (86, 56, 36), inset=0.004, bias=-38.6)
            u += 0.62
        # damask: little lozenges on the wallpaper
        for row in range(6):
            y = 1.1 + row * 0.25
            for k in range(14):
                uu = 0.15 + k * 0.28 + (0.14 if row % 2 else 0)
                if uu > R - 0.1:
                    continue
                c = {"zR": (uu, y, R - 0.003), "z0": (uu, y, 0.003), "xR": (R - 0.003, y, uu), "x0": (0.003, y, uu)}[wall]
                axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
                g = rng.randint(-6, 6)
                s.disc_on_wall(c, 0.05, axis, (0, 1.4, 0), (136 + g, 64 + g, 60 + g), 4, bias=-38)
        # picture rail and crown moulding
        rr.wall_quad(s, wall, 0, R, 2.42, 2.46, (150, 120, 60), inset=0.004, bias=-38.4)
        rr.wall_quad(s, wall, 0, R, 2.5, H, (90, 62, 40), inset=0.003, bias=-38.4)


def frame(s, wall, u0, u1, y0, y1, canvas, inset=0.006, bias=1.0, tilt=0.0):
    """Gilt frame with a dark canvas. `tilt` lifts the right edge (a crooked frame)."""
    def q(a0, a1, b0, b1, color, d, extra):
        pts = []
        for (u, y) in ((a0, b0), (a1, b0 + tilt * (a1 - a0)), (a1, b1 + tilt * (a1 - a0)), (a0, b1)):
            if wall == "zR":
                pts.append((u, y, R - d))
            elif wall == "z0":
                pts.append((u, y, d))
            elif wall == "xR":
                pts.append((R - d, y, u))
            else:
                pts.append((d, y, u))
        s.quad(pts, color, bias=bias + extra)
    q(u0 - 0.06, u1 + 0.06, y0 - 0.06, y1 + 0.06, GILT_DARK, inset, 0)
    q(u0 - 0.03, u1 + 0.03, y0 - 0.03, y1 + 0.03, GILT, inset + 0.002, 0.1)
    q(u0, u1, y0, y1, canvas, inset + 0.004, 0.2)
    return q


def figure(q, u0, u1, y0, y1, d, coat, skin=(214, 180, 150), hair=None, extra=None):
    """A painted sitter: shoulders and a head, crudely, the PS1 way."""
    w = u1 - u0
    cx = (u0 + u1) / 2
    q(u0 + w * 0.15, u1 - w * 0.15, y0, y0 + (y1 - y0) * 0.45, coat, d, 0.3)  # shoulders
    q(cx - w * 0.06, cx + w * 0.06, y0 + (y1 - y0) * 0.42, y0 + (y1 - y0) * 0.52, skin, d, 0.35)  # neck
    q(cx - w * 0.15, cx + w * 0.15, y0 + (y1 - y0) * 0.5, y0 + (y1 - y0) * 0.8, skin, d, 0.4)  # face
    if hair:
        q(cx - w * 0.19, cx + w * 0.19, y0 + (y1 - y0) * 0.74, y0 + (y1 - y0) * 0.9, hair, d, 0.45)
    # eyes
    for ex in (cx - w * 0.07, cx + w * 0.04):
        q(ex, ex + w * 0.03, y0 + (y1 - y0) * 0.66, y0 + (y1 - y0) * 0.69, (30, 24, 20), d, 0.5)
    if extra:
        extra(q, cx, w, d)


def sconce(s, u, y=1.75):
    """Brass gas sconce on the z = R wall: back plate, arm, glass mantle (cold)."""
    s.box(u - 0.04, u + 0.04, y - 0.12, y + 0.04, R - 0.03, R - 0.002, GILT_DARK, bias=1)
    s.beam((u, y - 0.04, R - 0.02), (u, y - 0.04, R - 0.16), 0.025, GILT, bias=1.1)
    s.box(u - 0.045, u + 0.045, y - 0.05, y + 0.1, R - 0.21, R - 0.12, (190, 186, 170), bias=1.2)
    s.box(u - 0.055, u + 0.055, y - 0.07, y - 0.04, R - 0.22, R - 0.11, GILT, bias=1.25)


def gallery_a(s):
    """Four ancestors with plaques along z = R, sconces between them; bust and tall window on x = R."""
    sitters = [  # left to right as seen: Cornelius, Ambrose, Dorothea, Beatrice
        ("cornelius", (46, 40, 38), (190, 150, 120), (60, 44, 34)),
        ("ambrose", (40, 46, 66), (220, 196, 176), (226, 224, 220)),
        ("dorothea", (150, 150, 170), (236, 210, 196), (170, 120, 60)),
        ("beatrice", (110, 110, 116), (222, 196, 180), (70, 50, 40)),
    ]
    width, gap, u = 0.56, 0.24, 0.2
    for name, coat, skin, hair in sitters:
        u0, u1, y0, y1 = u, u + width, 1.25, 2.1
        q = frame(s, "zR", u0, u1, y0, y1, (36, 32, 30))

        def extra(q, cx, w, d, name=name):
            if name == "cornelius":  # beard, pipe and the glint of a key at the frame corner
                q(cx - w * 0.13, cx + w * 0.13, y0 + (y1 - y0) * 0.46, y0 + (y1 - y0) * 0.6, (70, 50, 36), d, 0.5)
                q(cx + w * 0.12, cx + w * 0.32, y0 + (y1 - y0) * 0.5, y0 + (y1 - y0) * 0.54, (60, 40, 26), d, 0.55)
                q(u1 - 0.02, u1 + 0.05, y0 - 0.05, y0 + 0.01, (250, 230, 140), d - 0.004, 0.6)
            elif name == "dorothea":  # a little white dog in her arms
                q(cx - w * 0.2, cx + w * 0.05, y0 + (y1 - y0) * 0.12, y0 + (y1 - y0) * 0.3, (230, 226, 216), d, 0.5)
            elif name == "beatrice":  # closed fan
                q(cx + w * 0.05, cx + w * 0.25, y0 + (y1 - y0) * 0.14, y0 + (y1 - y0) * 0.2, (180, 40, 50), d, 0.5)
        figure(q, u0 + 0.04, u1 - 0.04, y0, y1 - 0.04, 0.01, coat, skin, hair, extra)
        # brass plaque below, with an engraved line
        rr.wall_quad(s, "zR", u0 + 0.13, u1 - 0.13, 1.03, 1.12, (200, 170, 80), inset=0.006, bias=1)
        rr.wall_quad(s, "zR", u0 + 0.17, u1 - 0.17, 1.065, 1.085, (90, 70, 30), inset=0.008, bias=1.2)
        u += width + gap
        if u < R - 0.4:
            sconce(s, u - gap / 2)

    # tall window on the x = R wall: moonlit panes behind heavy curtains
    zw0, zw1 = 1.05, 1.85
    rr.wall_quad(s, "xR", zw0 - 0.08, zw1 + 0.08, 0.9, 2.35, (60, 44, 32), inset=0.004, bias=0.5)
    rr.wall_quad(s, "xR", zw0, zw1, 0.98, 2.27, (40, 54, 84), inset=0.006, bias=1)
    for z in (zw0 + (zw1 - zw0) / 2,):
        rr.wall_quad(s, "xR", z - 0.02, z + 0.02, 0.98, 2.27, (60, 44, 32), inset=0.008, bias=1.5)
    for y in (1.4, 1.85):
        rr.wall_quad(s, "xR", zw0, zw1, y, y + 0.03, (60, 44, 32), inset=0.008, bias=1.5)
    s.disc_on_wall((R - 0.007, 2.05, zw0 + 0.25), 0.08, (0, 0, 1), (0, 1, 0), (210, 214, 200), 8, bias=1.4)  # moon
    for z0, z1 in ((zw0 - 0.32, zw0 + 0.02), (zw1 - 0.02, zw1 + 0.32)):  # curtains
        for k in range(3):
            za, zb = z0 + k * (z1 - z0) / 3, z0 + (k + 1) * (z1 - z0) / 3
            s.box(R - 0.12, R - 0.01, 0.02, 2.4, za, zb, (100, 24, 34) if k % 2 else (82, 18, 28), bias=1.6)
    s.box(R - 0.1, R - 0.02, 2.38, 2.44, zw0 - 0.4, zw1 + 0.4, GILT_DARK, bias=1.7)  # curtain pole

    # marble bust on a plinth beside the window
    marble, marble_dark = (214, 210, 200), (170, 166, 158)
    bx, bz = R - 0.6, 2.75
    s.box(bx - 0.22, bx + 0.22, 0, 0.08, bz - 0.22, bz + 0.22, marble_dark)
    s.box(bx - 0.16, bx + 0.16, 0.08, 1.0, bz - 0.16, bz + 0.16, marble)
    s.box(bx - 0.2, bx + 0.2, 1.0, 1.06, bz - 0.2, bz + 0.2, marble_dark)
    # carved inscription on the plinth's front faces
    for y in (0.62, 0.7, 0.78):
        s.quad([(bx - 0.161, y, bz - 0.11), (bx - 0.161, y, bz + 0.11), (bx - 0.161, y + 0.02, bz + 0.11),
                (bx - 0.161, y + 0.02, bz - 0.11)], (120, 116, 110), bias=0.5)
    s.box(bx - 0.17, bx + 0.17, 1.06, 1.26, bz - 0.12, bz + 0.12, marble)  # shoulders
    s.box(bx - 0.06, bx + 0.06, 1.26, 1.33, bz - 0.06, bz + 0.06, marble_dark)  # neck
    s.box(bx - 0.09, bx + 0.09, 1.33, 1.55, bz - 0.1, bz + 0.09, marble, bias=0.2)  # head
    s.box(bx - 0.1, bx + 0.1, 1.5, 1.58, bz - 0.11, bz + 0.1, (196, 192, 184), bias=0.25)  # curls


def gallery_c(s):
    """The lady's large crooked portrait on z = 0 above a velvet bench; gas pipe and valve on x = 0."""
    # the lady: a big frame, hung crooked and standing off the wall
    u0, u1, y0, y1 = 1.05, 2.45, 0.95, 2.3
    off = 0.06
    s.box(u0 - 0.08, u1 + 0.08, y0 - 0.08, y1 + 0.08, 0.0, off, (40, 30, 26), bias=0.4)  # shadow gap behind
    q = frame(s, "z0", u0, u1, y0, y1, (30, 28, 36), inset=off, bias=1.0, tilt=0.06)

    def lady(q, cx, w, d):
        q(cx - w * 0.08, cx + w * 0.08, y0 + (y1 - y0) * 0.56, y0 + (y1 - y0) * 0.6, (200, 190, 170), d, 0.55)  # pearls
        q(cx - w * 0.24, cx + w * 0.24, y0 + 0.02, y0 + (y1 - y0) * 0.18, (16, 14, 18), d, 0.5)  # black skirts
    figure(q, u0 + 0.1, u1 - 0.1, y0 + 0.02, y1 - 0.06, off + 0.012, (22, 20, 26), (226, 206, 196), (30, 24, 22), lady)
    # brass hinge pins on the left side of the frame
    for y in (y0 + 0.15, y1 - 0.15):
        s.box(u0 - 0.1, u0 - 0.05, y - 0.05, y + 0.05, off - 0.02, off + 0.02, (150, 130, 70), bias=1.5)
    # sconces either side of her
    for u in (0.6, 2.9):
        y = 1.75
        s.box(u - 0.04, u + 0.04, y - 0.12, y + 0.04, 0.002, 0.03, GILT_DARK, bias=1)
        s.beam((u, y - 0.04, 0.02), (u, y - 0.04, 0.16), 0.025, GILT, bias=1.1)
        s.box(u - 0.045, u + 0.045, y - 0.05, y + 0.1, 0.12, 0.21, (190, 186, 170), bias=1.2)

    # velvet bench in front of the portrait
    velvet, legs = (120, 30, 40), (60, 40, 24)
    for lx in (1.0, 2.42):
        for lz in (0.85, 1.25):
            s.box(lx, lx + 0.07, 0, 0.36, lz, lz + 0.07, legs)
    s.box(0.95, 2.55, 0.36, 0.44, 0.8, 1.37, (80, 52, 30))
    s.box(0.98, 2.52, 0.44, 0.56, 0.83, 1.34, velvet)
    s.box(1.5, 2.1, 0.56, 0.6, 0.95, 1.25, (140, 40, 50), bias=0.3)  # the lump under the cushion
    for x in (1.3, 1.75, 2.2):  # buttons
        s.box(x - 0.02, x + 0.02, 0.6, 0.62, 1.08, 1.12, (90, 20, 26), bias=0.4)

    # gas pipe along the x = 0 skirting, rising to a sconce feed, with a valve near the floor
    pipe = (130, 120, 96)
    s.beam((0.06, 0.25, 3.6), (0.06, 0.25, 1.1), 0.05, pipe, bias=0.5)
    s.beam((0.06, 0.25, 1.1), (0.06, 0.25, 0.0), 0.05, pipe, bias=0.5)
    s.beam((0.06, 0.25, 3.6), (0.06, 1.7, 3.6), 0.05, pipe, bias=0.5)
    s.box(0.0, 0.1, 1.62, 1.8, 3.52, 3.68, GILT_DARK, bias=0.6)
    s.beam((0.06, 1.7, 3.6), (0.2, 1.7, 3.6), 0.025, GILT, bias=0.7)
    s.box(0.15, 0.25, 1.66, 1.82, 3.55, 3.65, (190, 186, 170), bias=0.8)
    # the valve body with its bare square spindle sticking out
    vz = 2.2
    s.box(0.02, 0.2, 0.1, 0.42, vz - 0.16, vz + 0.16, (170, 146, 74), bias=0.8)
    s.box(0.2, 0.24, 0.14, 0.38, vz - 0.12, vz + 0.12, (120, 100, 50), bias=0.9)
    s.box(0.24, 0.36, 0.22, 0.3, vz - 0.04, vz + 0.04, (110, 108, 104), bias=1)

ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), gallery_a],
    c=[lambda s: shell(s, ("z0", "x0")), gallery_c],
    light_a=(150, 90),
    light_c=(170, 100),
    light=GAS,
)
