"""The Attic: steamer trunk, dress form, rocking chair and round window (A);
magic lantern on a crate, white sheet over the chimney and the low door (C).

The roof is a gable: the ridge runs along x at z = RIDGE, the slopes come down to knee walls
at z = 0 and z = R, and the x = 0 / x = R walls are the gable ends. Each camera only gets the
slope and gable end it faces (the ones behind it would sit below its eye)."""

import math
import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
KNEE = 0.9
RIDGE = 2.0


def roof_y(z):
    """Height of the roof at depth z."""
    return KNEE + (HH - KNEE) * (1 - abs(z - RIDGE) / RIDGE)


def shell(s, slope, gable):
    """Floorboards, one knee wall + roof slope (`slope` is "z0" or "zR") and one gable end ("x0" or "xR")."""
    board, gap = (84, 64, 46), (46, 34, 24)
    s.quad([(0, 0, 0), (R, 0, 0), (R, 0, R), (0, 0, R)], board, bias=-50)
    for k in range(1, 14):
        z = R * k / 14
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], gap, bias=-45)
    zw = R if slope == "zR" else 0.0
    # knee wall
    s.quad([(0, 0, zw), (R, 0, zw), (R, KNEE, zw), (0, KNEE, zw)], (92, 78, 62), bias=-40)
    # roof slope: boards between rafters
    s.quad([(0, KNEE, zw), (R, KNEE, zw), (R, HH, RIDGE), (0, HH, RIDGE)], (84, 68, 52), bias=-41)
    rng = random.Random(31 if slope == "zR" else 32)
    for k in range(1, 9):  # roof boards running along x
        t = k / 9
        y, z = KNEE + (HH - KNEE) * t, zw + (RIDGE - zw) * t
        y2, z2 = y + 0.012, z + (RIDGE - zw) * 0.012 / (HH - KNEE)
        s.quad([(0, y, z), (R, y, z), (R, y2, z2), (0, y2, z2)], (50, 40, 30), bias=-40.5)
    for k in range(0, 7):  # rafters
        x = 0.1 + k * (R - 0.2) / 6
        s.beam((x, KNEE, zw + (0.06 if zw == 0 else -0.06)), (x, HH - 0.04, RIDGE), 0.11, (96, 72, 50), bias=-30)
    s.beam((0, HH - 0.04, RIDGE), (R, HH - 0.04, RIDGE), 0.14, (90, 68, 48), bias=-29)  # ridge beam
    for xg in (0.0, R):  # gable ends: five-sided walls of vertical planks
        s.quad([(xg, 0, 0), (xg, 0, R), (xg, KNEE, R), (xg, HH, RIDGE), (xg, KNEE, 0)],
               (112, 98, 78) if (xg == R) == (gable == "xR") else (96, 84, 66), bias=-39.5)
        u = 0.12
        while u < R:
            top = roof_y(u)
            s.quad([(xg, 0, u), (xg, 0, u + 0.012), (xg, top, u + 0.012), (xg, top, u)], (72, 60, 46), bias=-39)
            u += rng.uniform(0.2, 0.28)
    # a cobweb in the corner where the slope meets the far gable
    xg = R if gable == "xR" else 0.0
    cz = zw + (0.3 if zw == 0 else -0.3)
    cx = xg + (0.01 if xg == 0 else -0.01)
    s.quad([(cx, KNEE, zw), (cx, KNEE + 0.4, cz), (cx + (0.3 if xg == 0 else -0.3), KNEE + 0.15, zw)],
           (104, 104, 100), bias=-28)


def attic_a(s):
    """Trunk against the z = R knee wall, dress form, rocking chair and round window on the x = R gable."""
    # round window high in the gable, moon and night sky
    wc = (R - 0.004, 1.72, RIDGE)
    s.disc_on_wall(wc, 0.36, (0, 0, 1), (0, 1, 0), (70, 54, 40), 14, bias=0.5)
    s.disc_on_wall((R - 0.006, wc[1], wc[2]), 0.3, (0, 0, 1), (0, 1, 0), (24, 32, 62), 14, bias=1)
    s.disc_on_wall((R - 0.008, 1.8, RIDGE + 0.1), 0.08, (0, 0, 1), (0, 1, 0), (226, 226, 210), 10, bias=1.3)
    s.beam((R - 0.01, wc[1] - 0.3, wc[2]), (R - 0.01, wc[1] + 0.3, wc[2]), 0.03, (70, 54, 40), bias=1.5)
    s.beam((R - 0.01, wc[1], wc[2] - 0.3), (R - 0.01, wc[1], wc[2] + 0.3), 0.03, (70, 54, 40), bias=1.5)
    # moonlight pool on the floor
    s.quad([(R - 0.2, 0.003, 1.6), (R - 0.2, 0.003, 2.4), (R - 1.3, 0.003, 2.6), (R - 1.2, 0.003, 1.5)],
           (104, 106, 124), bias=-44)

    # steamer trunk: leather body, domed lid, two straps, brass corners and travel labels
    x0, x1, z0, z1 = 1.0, 2.2, R - 0.7, R - 0.1
    leather = (104, 64, 38)
    s.box(x0, x1, 0, 0.5, z0, z1, leather)
    s.box(x0 - 0.02, x1 + 0.02, 0.5, 0.58, z0 - 0.02, z1 + 0.02, (120, 76, 44))  # lid
    s.box(x0 + 0.02, x1 - 0.02, 0.58, 0.64, z0 + 0.04, z1 - 0.04, (128, 82, 48), bias=0.1)  # dome
    s.box(x0 - 0.025, x1 + 0.025, 0.46, 0.5, z0 - 0.025, z1 + 0.025, (150, 120, 60), bias=0.3)  # brass band
    for x in (x0 + 0.22, x1 - 0.3):  # straps
        s.box(x, x + 0.08, 0, 0.65, z0 - 0.03, z1 + 0.03, (84, 52, 32), bias=0.6)
    for x in (x0, x1 - 0.08):  # brass corners
        s.box(x - 0.01, x + 0.09, 0, 0.1, z0 - 0.03, z0 + 0.06, (170, 140, 66), bias=0.7)
    for (lx, ly, c) in ((1.4, 0.18, (176, 64, 52)), (1.72, 0.26, (210, 200, 160)), (1.5, 0.05, (80, 120, 150))):
        rr.wall_quad(s, "zR", lx, lx + 0.2, ly, ly + 0.13, c, inset=R - z0 + 0.006, bias=1.4)
    s.box(1.56, 1.66, 0.4, 0.54, z0 - 0.045, z0, (190, 160, 76), bias=1.5)  # clasp
    # a hatbox on the floor beside it
    s.box(2.35, 2.75, 0, 0.3, R - 0.6, R - 0.2, (140, 110, 120))
    s.box(2.33, 2.77, 0.3, 0.34, R - 0.62, R - 0.18, (120, 90, 100), bias=0.4)

    # dress form: tripod stand, bell skirt widening to the hem, narrow waist, bodice, neck knob
    fx, fz = 2.95, 2.55
    for a in (0.3, 2.4, 4.5):
        s.beam((fx, 0.15, fz), (fx + 0.22 * math.cos(a), 0.0, fz + 0.22 * math.sin(a)), 0.035, (50, 40, 30))
    gown, lace = (150, 126, 88), (196, 180, 136)
    tiers = 6
    for k in range(tiers):  # skirt from the hem (k = 0) up to the waist
        y0 = 0.12 + k * 0.1
        r = 0.32 - k * 0.035
        shade = tuple(int(c * (0.9 + 0.02 * k)) for c in gown)
        s.box(fx - r, fx + r, y0, y0 + 0.1, fz - r, fz + r, shade, bias=0.05 * k)
    s.box(fx - 0.14, fx + 0.14, 0.72, 0.85, fz - 0.12, fz + 0.12, (110, 60, 56), bias=0.35)  # sash
    s.box(fx - 0.17, fx + 0.17, 0.85, 1.12, fz - 0.14, fz + 0.14, (162, 140, 100), bias=0.4)  # bodice
    s.box(fx - 0.2, fx + 0.2, 1.12, 1.24, fz - 0.15, fz + 0.15, lace, bias=0.45)  # lace shoulders
    s.beam((fx, 1.24, fz), (fx, 1.36, fz), 0.06, (60, 48, 34), bias=0.5)
    s.box(fx - 0.05, fx + 0.05, 1.36, 1.42, fz - 0.05, fz + 0.05, (70, 56, 40), bias=0.55)
    s.box(fx - 0.33, fx + 0.33, 0.12, 0.16, fz - 0.33, fz + 0.33, lace, bias=0.1)  # hem
    s.box(fx - 0.29, fx - 0.17, 0.45, 0.58, fz - 0.31, fz - 0.2, (130, 114, 80), bias=0.6)  # pocket
    # rocking chair facing into the room, near the x = R gable
    cx, cz = 3.25, 1.35
    wood, dark = (110, 70, 44), (74, 46, 30)
    for dz in (-0.24, 0.24):  # rockers
        for k in range(5):
            a0, a1 = -0.5 + k * 0.25, -0.25 + k * 0.25
            p0 = (cx + 0.55 * math.sin(a0), 0.06 + 0.25 * (1 - math.cos(a0)), cz + dz)
            p1 = (cx + 0.55 * math.sin(a1), 0.06 + 0.25 * (1 - math.cos(a1)), cz + dz)
            s.beam(p0, p1, 0.04, dark)
    for dx in (-0.2, 0.2):
        for dz in (-0.22, 0.22):
            s.beam((cx + dx, 0.08, cz + dz), (cx + dx, 0.45, cz + dz), 0.04, dark)
    s.box(cx - 0.24, cx + 0.24, 0.45, 0.5, cz - 0.25, cz + 0.25, wood)  # seat
    s.box(cx - 0.2, cx + 0.2, 0.5, 0.56, cz - 0.21, cz + 0.21, (120, 40, 40), bias=0.3)  # cushion
    for dz in (-0.22, 0.22):  # back posts leaning back toward the gable
        s.beam((cx + 0.22, 0.45, cz + dz), (cx + 0.34, 1.15, cz + dz), 0.045, dark)
    for y in (0.75, 0.95, 1.12):
        x = cx + 0.22 + 0.12 * (y - 0.45) / 0.7
        s.beam((x, y, cz - 0.22), (x, y, cz + 0.22), 0.04, wood, bias=0.2)


def attic_c(s):
    """Chimney breast with the sheet and the low door on the x = 0 gable, magic lantern on a crate."""
    brick, mortar = (122, 62, 48), (86, 50, 42)
    cz0, cz1, depth = 1.55, 2.45, 0.35
    s.box(0.0, depth, 0, HH, cz0, cz1, brick)
    for k in range(1, 18):  # mortar courses on the face
        y = k * 0.15
        rr.wall_quad(s, "x0", cz0, cz1, y, y + 0.015, mortar, inset=depth + 0.002, bias=0.5)
    # white sheet pinned over the breast
    sheet = (214, 212, 202)
    rr.wall_quad(s, "x0", cz0 + 0.06, cz1 - 0.06, 0.62, 1.82, sheet, inset=depth + 0.006, bias=1)
    for z in (cz0 + 0.3, cz0 + 0.6):  # folds
        rr.wall_quad(s, "x0", z, z + 0.02, 0.62, 1.82, (176, 174, 166), inset=depth + 0.008, bias=1.2)
    for z in (cz0 + 0.08, cz1 - 0.12):  # pins
        rr.wall_quad(s, "x0", z, z + 0.04, 1.76, 1.8, (60, 60, 60), inset=depth + 0.01, bias=1.4)

    # low door in the panelling beside the chimney
    dz0, dz1, dh = 2.75, 3.35, 1.2
    rr.wall_quad(s, "x0", dz0 - 0.05, dz1 + 0.05, 0, dh + 0.05, (56, 40, 28), inset=0.004, bias=0.6)
    rr.wall_quad(s, "x0", dz0, dz1, 0, dh, (118, 96, 70), inset=0.006, bias=1)
    for z in (dz0 + 0.2, dz0 + 0.4):
        rr.wall_quad(s, "x0", z, z + 0.012, 0, dh, (88, 70, 50), inset=0.008, bias=1.2)

    # crate with the magic lantern and the slide box, aimed at the sheet
    wood = (128, 98, 62)
    s.box(1.3, 2.05, 0, 0.5, 1.65, 2.35, wood)
    for y in (0.16, 0.33):
        s.box(1.29, 2.06, y, y + 0.025, 1.64, 2.36, (86, 64, 40), bias=0.3)
    brass, dark = (176, 140, 70), (60, 50, 40)
    s.box(1.5, 1.88, 0.5, 0.92, 1.84, 2.16, (112, 84, 48))  # lamp house
    s.box(1.47, 1.91, 0.5, 0.55, 1.81, 2.19, brass, bias=0.3)  # base rim
    s.box(1.47, 1.91, 0.92, 0.96, 1.81, 2.19, brass, bias=0.3)  # top rim
    rr.wall_quad(s, "z0", 1.58, 1.8, 0.62, 0.84, (36, 30, 26), inset=2.165, bias=0.6)  # dark lamp window
    rr.wall_quad(s, "z0", 1.68, 1.7, 0.62, 0.84, brass, inset=2.168, bias=0.7)
    s.beam((1.69, 0.96, 2.0), (1.69, 1.2, 2.0), 0.1, dark, bias=0.3)  # chimney
    s.box(1.6, 1.78, 1.2, 1.24, 1.91, 2.09, brass, bias=0.4)  # chimney cap
    s.box(1.42, 1.5, 0.56, 0.86, 1.88, 2.12, (90, 70, 50), bias=0.4)  # slide carrier
    s.beam((1.42, 0.71, 2.0), (1.08, 0.71, 2.0), 0.15, brass, bias=0.5)  # lens tube
    s.box(1.06, 1.12, 0.62, 0.8, 1.91, 2.09, (196, 160, 80), bias=0.6)  # lens ring
    s.disc_on_wall((1.055, 0.71, 2.0), 0.06, (0, 0, 1), (0, 1, 0), (60, 80, 100), 8, bias=0.8)
    # slide box beside the lantern
    s.box(1.78, 2.0, 0.5, 0.6, 2.18, 2.33, (88, 54, 34), bias=0.4)
    s.box(1.78, 2.0, 0.6, 0.62, 2.18, 2.33, (110, 70, 44), bias=0.5)
    s.box(1.76, 1.79, 0.54, 0.58, 2.24, 2.27, brass, bias=0.6)


ROOM = dict(
    a=[lambda s: shell(s, "zR", "xR"), attic_a],
    c=[lambda s: shell(s, "z0", "x0"), attic_c],
    light_a=(250, 95),
    light_c=(150, 120),
    light=rr.MOON,
)
