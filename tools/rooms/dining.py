"""The Dining Hall: long table laid for four with place cards and a candelabra, a walnut
sideboard and drawn curtains (A); family portrait over a cold fireplace, the servants'
bell board and oak panelling (C)."""

import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
WOOD, WOOD_DARK = (92, 58, 36), (58, 36, 24)
SILVER = (176, 176, 170)


def shell(s, far_walls):
    """Dark red damask walls over oak wainscoting, parquet floor, a plaster cornice."""
    rr.walls_floor(s, (84, 58, 38), (50, 40, 34), (86, 40, 38), (104, 50, 46))
    rng = random.Random(23)
    # parquet: alternating plank rows
    for k in range(10):
        z = R * k / 10
        g = rng.randint(-8, 8)
        s.quad([(0, 0.002, z + 0.01), (R, 0.002, z + 0.01), (R, 0.002, z + R / 10 - 0.01), (0, 0.002, z + R / 10 - 0.01)],
               (96 + g, 64 + g, 40 + g) if k % 2 else (84 + g, 56 + g, 36 + g), bias=-45)
    # a rug under the table
    s.quad([(0.9, 0.004, 1.2), (3.3, 0.004, 1.2), (3.3, 0.004, 3.4), (0.9, 0.004, 3.4)], (70, 30, 34), bias=-44)
    s.quad([(1.05, 0.005, 1.35), (3.15, 0.005, 1.35), (3.15, 0.005, 3.25), (1.05, 0.005, 3.25)], (100, 44, 42), bias=-43.5)
    for wall in far_walls:
        rr.wall_quad(s, wall, 0, R, 0, 1.0, WOOD_DARK, inset=0.002, bias=-39)  # wainscoting
        u = 0.1
        while u < R - 0.3:
            rr.wall_quad(s, wall, u, u + 0.5, 0.12, 0.88, WOOD, inset=0.004, bias=-38.6)
            u += 0.62
        rr.wall_quad(s, wall, 0, R, 0.98, 1.05, (120, 84, 52), inset=0.006, bias=-38.4)  # dado rail
        rr.wall_quad(s, wall, 0, R, HH - 0.14, HH, (150, 140, 120), inset=0.004, bias=-38.5)  # cornice
        u = 0.2
        while u < R:  # damask stripes
            rr.wall_quad(s, wall, u, u + 0.08, 1.05, HH - 0.14, (110, 52, 46), inset=0.003, bias=-38.8)
            u += 0.4


def chair(s, x, z, back_dir):
    """A high-backed chair; back_dir = -1 puts the back on the low-z side, +1 on the high-z side."""
    s.box(x - 0.22, x + 0.22, 0.42, 0.48, z - 0.2, z + 0.2, (110, 70, 42), bias=0.3)  # seat
    s.box(x - 0.2, x + 0.2, 0.44, 0.47, z - 0.18, z + 0.18, (120, 40, 40), bias=0.35)  # cushion
    for lx in (x - 0.19, x + 0.16):
        for lz in (z - 0.17, z + 0.14):
            s.box(lx, lx + 0.04, 0, 0.42, lz, lz + 0.04, WOOD_DARK, bias=0.2)
    bz = z + back_dir * 0.2
    s.box(x - 0.22, x + 0.22, 0.48, 1.25, bz - 0.03, bz + 0.03, (100, 64, 38), bias=0.4)
    s.box(x - 0.15, x + 0.15, 0.6, 1.12, bz - 0.035, bz + 0.035, (120, 40, 40), bias=0.45)


def candelabra(s, x, z, top):
    s.box(x - 0.1, x + 0.1, top, top + 0.03, z - 0.1, z + 0.1, SILVER, bias=1)  # foot
    s.beam((x, top, z), (x, top + 0.38, z), 0.035, SILVER, bias=1)
    s.beam((x - 0.24, top + 0.32, z), (x + 0.24, top + 0.32, z), 0.03, SILVER, bias=1.1)  # arms
    for k, cx in enumerate((x - 0.24, x - 0.08, x + 0.08, x + 0.24)):
        y0 = top + (0.38 if k in (1, 2) else 0.32)
        if k in (1, 2):
            s.beam((cx, top + 0.32, z), (cx, y0, z), 0.025, SILVER, bias=1.1)
        s.box(cx - 0.035, cx + 0.035, y0, y0 + 0.03, z - 0.035, z + 0.035, SILVER, bias=1.2)
        s.box(cx - 0.022, cx + 0.022, y0 + 0.03, y0 + 0.26, z - 0.022, z + 0.022, (226, 220, 196), bias=1.3)
        s.box(cx - 0.004, cx + 0.004, y0 + 0.26, y0 + 0.29, z - 0.004, z + 0.004, (30, 26, 22), bias=1.4)


def dining_a(s):
    """Long table along x with four chairs and settings; sideboard on x = R; curtains on z = R."""
    top = 0.78
    x0, x1, z0, z1 = 1.0, 3.0, 2.0, 2.9
    for lx in (x0 + 0.08, x1 - 0.16):
        for lz in (z0 + 0.08, z1 - 0.16):
            s.box(lx, lx + 0.08, 0, top - 0.06, lz, lz + 0.08, WOOD_DARK)
    s.box(x0, x1, top - 0.1, top - 0.04, z0, z1, (80, 50, 30))  # apron
    s.box(x0 - 0.04, x1 + 0.04, top - 0.04, top, z0 - 0.04, z1 + 0.04, (110, 70, 42))
    # white tablecloth with a long runner
    s.quad([(x0 + 0.02, top + 0.002, z0 + 0.02), (x1 - 0.02, top + 0.002, z0 + 0.02),
            (x1 - 0.02, top + 0.002, z1 - 0.02), (x0 + 0.02, top + 0.002, z1 - 0.02)], (196, 190, 172), bias=0.5)
    rr.wall_quad(s, "z0", x0 - 0.03, x1 + 0.03, top - 0.22, top, (180, 174, 156), inset=z0 - 0.045, bias=0.4)
    s.quad([(x0 + 0.1, top + 0.004, 2.38), (x1 - 0.1, top + 0.004, 2.38), (x1 - 0.1, top + 0.004, 2.52),
            (x0 + 0.1, top + 0.004, 2.52)], (130, 40, 40), bias=0.6)
    # four settings: plate, glass and a folded place card at each seat
    for px, pz, side in ((1.5, z0 + 0.2, -1), (2.5, z0 + 0.2, -1), (1.5, z1 - 0.2, 1), (2.5, z1 - 0.2, 1)):
        s.disc_on_wall((px, top + 0.006, pz), 0.13, (1, 0, 0), (0, 0, 1), (220, 218, 208), 10, bias=0.8)
        s.disc_on_wall((px, top + 0.008, pz), 0.08, (1, 0, 0), (0, 0, 1), (170, 176, 186), 8, bias=0.9)
        s.box(px + 0.18, px + 0.22, top, top + 0.14, pz - 0.02, pz + 0.02, (170, 200, 210), bias=1)  # glass
        for fx in (px - 0.2, px + 0.26):  # cutlery
            s.box(fx - 0.01, fx + 0.01, top + 0.004, top + 0.012, pz - 0.1, pz + 0.1, SILVER, bias=0.9)
        cz = pz - side * 0.17
        s.quad([(px - 0.07, top, cz), (px + 0.07, top, cz), (px + 0.07, top + 0.07, cz + side * 0.02),
                (px - 0.07, top + 0.07, cz + side * 0.02)], (236, 230, 210), bias=1.2)  # place card
        s.quad([(px - 0.05, top + 0.035, cz + side * 0.008 - 0.004), (px + 0.05, top + 0.035, cz + side * 0.008 - 0.004),
                (px + 0.05, top + 0.045, cz + side * 0.012 - 0.004), (px - 0.05, top + 0.045, cz + side * 0.012 - 0.004)],
               (60, 50, 50), bias=1.3)  # a name in ink
    candelabra(s, 2.0, 2.45, top)
    # chairs: two on each long side, one pulled out
    chair(s, 1.5, z1 + 0.32, 1)
    chair(s, 2.5, z1 + 0.32, 1)
    chair(s, 1.5, z0 - 0.32, -1)
    chair(s, 2.62, z0 - 0.62, -1)  # pulled out

    # walnut sideboard against the x = R wall
    xs = R - 0.5
    s.box(xs, R - 0.02, 0, 0.12, 1.0, 2.6, (40, 26, 18))
    s.box(xs, R - 0.02, 0.12, 0.92, 1.0, 2.6, (70, 42, 28))
    s.box(xs - 0.03, R - 0.01, 0.92, 0.97, 0.97, 2.63, (96, 60, 38))
    xf = xs - 0.004
    s.quad([(xf, 0.74, 1.08), (xf, 0.74, 2.52), (xf, 0.88, 2.52), (xf, 0.88, 1.08)], (96, 60, 38), bias=1)  # drawer
    s.box(xf - 0.04, xf, 0.79, 0.83, 1.7, 1.9, SILVER, bias=1.5)
    for (z0d, z1d) in ((1.08, 1.76), (1.84, 2.52)):  # cupboard doors
        s.quad([(xf, 0.18, z0d), (xf, 0.18, z1d), (xf, 0.68, z1d), (xf, 0.68, z0d)], (88, 54, 34), bias=1)
        s.box(xf - 0.03, xf, 0.42, 0.48, z1d - 0.1, z1d - 0.05, SILVER, bias=1.5)
    # a silver tureen and two decanters on top
    s.box(R - 0.36, R - 0.12, 0.97, 1.12, 1.25, 1.55, SILVER, bias=1.2)
    s.box(R - 0.32, R - 0.16, 1.12, 1.16, 1.3, 1.5, (200, 200, 194), bias=1.3)
    for dz in (2.05, 2.3):
        s.box(R - 0.3, R - 0.2, 0.97, 1.17, dz, dz + 0.1, (110, 40, 50), bias=1.2)
        s.box(R - 0.27, R - 0.23, 1.17, 1.25, dz + 0.03, dz + 0.07, (150, 170, 176), bias=1.3)

    # heavy velvet curtains drawn across the window on z = R
    rr.wall_quad(s, "zR", 0.95, 2.75, HH - 0.3, HH - 0.24, (150, 120, 60), inset=0.03, bias=0.5)  # pole
    for k in range(9):
        u = 1.0 + k * 0.19
        c = (120, 28, 34) if k % 2 else (96, 20, 28)
        rr.wall_quad(s, "zR", u, u + 0.19, 0.05, HH - 0.28, c, inset=0.02 + (k % 2) * 0.03, bias=0.6)
    rr.wall_quad(s, "zR", 1.0, 2.71, 0.95, 1.05, (150, 120, 60), inset=0.07, bias=0.8)  # tie-back band


def dining_c(s):
    """Fireplace with the family portrait above on z = 0; the bell board on the x = 0 wall."""
    # stone fireplace
    stone = (140, 132, 120)
    s.box(1.15, 2.65, 0, 1.15, 0.0, 0.4, stone)
    s.box(1.05, 2.75, 1.15, 1.25, 0.0, 0.48, (160, 152, 140), bias=0.3)  # mantel shelf
    rr.wall_quad(s, "z0", 1.45, 2.35, 0.0, 0.85, (22, 18, 16), inset=0.402, bias=1)  # firebox opening
    s.quad([(1.45, 0.006, 0.42), (2.35, 0.006, 0.42), (2.4, 0.006, 0.75), (1.4, 0.006, 0.75)], (110, 104, 96), bias=-40)  # hearth
    for k in range(4):  # cold ashes and a log
        s.box(1.6 + k * 0.15, 1.7 + k * 0.15, 0.0, 0.06, 0.12, 0.3, (70, 66, 62), bias=1.2)
    s.beam((1.6, 0.1, 0.22), (2.2, 0.12, 0.25), 0.1, (50, 34, 24), bias=1.3)
    for cx in (1.25, 2.55):  # candlesticks on the mantel
        s.box(cx - 0.04, cx + 0.04, 1.25, 1.45, 0.2, 0.28, SILVER, bias=1)
    # the family portrait in a gilt frame
    rr.wall_quad(s, "z0", 1.2, 2.6, 1.42, 2.36, (170, 136, 60), inset=0.01, bias=0.5)
    rr.wall_quad(s, "z0", 1.28, 2.52, 1.5, 2.28, (46, 40, 34), inset=0.014, bias=0.7)
    figures = ((1.5, 0.3, 1.66, (50, 62, 110), (196, 160, 130)),   # father
               (1.82, 0.26, 1.62, (90, 40, 60), (206, 170, 140)),  # mother
               (2.12, 0.24, 1.66, (70, 90, 110), (210, 176, 148)),  # daughter
               (2.36, 0.16, 1.42, (70, 96, 56), (214, 180, 150)))  # little boy
    for u, w, shoulder, coat, skin in figures:
        rr.wall_quad(s, "z0", u - w / 2, u + w / 2, 1.5, shoulder + 0.3, coat, inset=0.018, bias=1.5)
        r = 0.08 if w > 0.2 else 0.065
        s.disc_on_wall((u, shoulder + 0.3 + r * 0.8, 0.022), r, (1, 0, 0), (0, 1, 0), skin, 8, bias=1.6)
    rr.wall_quad(s, "z0", 1.72, 2.08, 1.3, 1.38, (190, 160, 80), inset=0.012, bias=0.8)  # brass plaque

    # servants' bell board on the x = 0 wall: four bells on coiled springs
    rr.wall_quad(s, "x0", 1.3, 2.7, 1.45, 2.05, (60, 38, 24), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.36, 2.64, 1.5, 2.0, (106, 70, 42), inset=0.008, bias=0.7)
    for k in range(4):
        z = 1.53 + k * 0.32
        rr.wall_quad(s, "x0", z - 0.1, z + 0.1, 1.86, 1.94, (224, 216, 190), inset=0.01, bias=0.9)  # name label
        s.beam((0.01, 1.82, z), (0.12, 1.72, z), 0.015, (150, 140, 120), bias=1)  # spring arm
        s.box(0.06, 0.18, 1.56, 1.7, z - 0.06, z + 0.06, (200, 170, 70), bias=1.2)  # bell
        s.box(0.08, 0.16, 1.53, 1.56, z - 0.02, z + 0.02, (150, 120, 50), bias=1.3)
    rr.wall_quad(s, "x0", 1.8, 2.2, 1.24, 1.42, (226, 220, 200), inset=0.005, bias=0.8)  # pinned card
    s.box(0.004, 0.02, 1.38, 1.4, 1.99, 2.01, (180, 40, 40), bias=1)
    # the panel seam beside the fireplace
    rr.wall_quad(s, "z0", 2.92, 2.94, 0.0, 2.1, (24, 16, 12), inset=0.006, bias=0.9)
    rr.wall_quad(s, "z0", 3.5, 3.52, 0.0, 2.1, (24, 16, 12), inset=0.006, bias=0.9)
    rr.wall_quad(s, "z0", 2.92, 3.52, 2.08, 2.1, (24, 16, 12), inset=0.006, bias=0.9)
    # a gas wall sconce, unlit
    s.box(0.004, 0.08, 1.95, 2.02, 3.2, 3.28, (170, 136, 60), bias=0.8)
    s.box(0.03, 0.14, 2.02, 2.16, 3.18, 3.3, (210, 200, 180), bias=0.9)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), dining_a],
    c=[lambda s: shell(s, ("z0", "x0")), dining_c],
    light_a=(150, 120),
    light_c=(150, 90),
    light=rr.WARM,
)
