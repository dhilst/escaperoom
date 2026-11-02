"""The Grand Foyer: a decayed entrance hall with a checkered floor.

Camera A: coat rack with an overcoat and an umbrella stand on the z = ROOM wall,
grandfather clock on the x = ROOM wall.
Camera C: the great double front door with three lock plates on the z = 0 wall,
a crystal chandelier hanging from the ceiling, and a winch on the x = 0 wall.
"""

import math
import random

import render_rooms as rr

R, H = rr.ROOM, rr.HEIGHT


def shell(s):
    rr.walls_floor(s, (60, 56, 50), (40, 34, 30), (78, 52, 46), (92, 62, 52))
    # checkered marble floor
    n = 8
    t = R / n
    for i in range(n):
        for j in range(n):
            col = (150, 144, 128) if (i + j) % 2 else (36, 34, 32)
            s.quad([(i * t, 0.001, j * t), ((i + 1) * t, 0.001, j * t), ((i + 1) * t, 0.001, (j + 1) * t),
                    (i * t, 0.001, (j + 1) * t)], col, bias=-45)
    rng = random.Random(13)
    for wall in ("z0", "zR", "x0", "xR"):
        # dark wood wainscoting with panels, a dado rail, and stained wallpaper above
        rr.wall_quad(s, wall, 0, R, 0, 0.95, (70, 46, 30), inset=0.003, bias=-39)
        u = 0.1
        while u < R - 0.3:
            rr.wall_quad(s, wall, u, u + 0.42, 0.15, 0.8, (84, 56, 36), inset=0.005, bias=-38.5)
            u += 0.52
        rr.wall_quad(s, wall, 0, R, 0.95, 1.0, (110, 80, 50), inset=0.006, bias=-38.4)
        # wallpaper stripes
        u = 0.0
        while u < R:
            rr.wall_quad(s, wall, u, u + 0.05, 1.0, H, (66, 42, 38), inset=0.003, bias=-38.8)
            u += 0.25
        # crown moulding
        rr.wall_quad(s, wall, 0, R, H - 0.12, H, (100, 84, 66), inset=0.006, bias=-38.4)
        # peeling patches of plaster
        for _ in range(3):
            u0, y0 = rng.uniform(0.2, R - 0.6), rng.uniform(1.3, 2.2)
            rr.wall_quad(s, wall, u0, u0 + rng.uniform(0.15, 0.35), y0, y0 + rng.uniform(0.1, 0.25),
                         (120, 108, 90), inset=0.007, bias=-38.3)


def foyer_a(s):
    """Coat rack + overcoat and umbrella stand on z = ROOM, grandfather clock on x = ROOM."""
    wood = (90, 58, 34)
    # coat rack: a pole on a cross foot with pegs at the top
    cx, cz = 0.95, R - 0.35
    s.beam((cx, 0.02, cz), (cx, 1.85, cz), 0.06, wood)
    for dx, dz in ((0.25, 0), (-0.25, 0), (0, 0.22), (0, -0.25)):
        s.beam((cx, 0.08, cz), (cx + dx, 0.0, cz + dz), 0.04, wood)
        s.beam((cx, 1.75, cz), (cx + dx * 0.8, 1.88, cz + dz * 0.8), 0.035, wood)
    s.box(cx - 0.05, cx + 0.05, 1.85, 1.92, cz - 0.05, cz + 0.05, (120, 84, 50))
    # the overcoat hanging from it: shoulders, a long body and a sagging pocket
    coat = (58, 66, 54)
    s.box(cx - 0.24, cx + 0.24, 1.48, 1.74, cz - 0.17, cz - 0.04, coat, bias=0.4)
    s.box(cx - 0.28, cx + 0.28, 0.62, 1.5, cz - 0.2, cz - 0.06, (52, 60, 48), bias=0.4)
    s.box(cx - 0.08, cx + 0.08, 1.66, 1.8, cz - 0.15, cz - 0.05, (40, 44, 36), bias=0.5)  # collar
    rr.wall_quad(s, "zR", cx - 0.01, cx + 0.01, 0.65, 1.6, (34, 38, 30), inset=0.35 + 0.205, bias=0.6)  # front seam
    pocket_z = cz - 0.205
    s.quad([(cx + 0.05, 0.78, pocket_z), (cx + 0.24, 0.76, pocket_z), (cx + 0.24, 0.98, pocket_z),
            (cx + 0.05, 0.98, pocket_z)], (40, 46, 36), bias=0.7)
    for (bx, by) in ((cx - 0.06, 1.35), (cx - 0.06, 1.12), (cx - 0.06, 0.89)):
        s.disc_on_wall((bx, by, pocket_z - 0.001), 0.018, (1, 0, 0), (0, 1, 0), (150, 130, 80), 5, bias=0.8)

    # umbrella stand: a glazed ceramic cylinder (octagonal box stack) full of black umbrellas and leaves
    ux, uz = 1.75, R - 0.32
    r = 0.2
    for k in range(8):
        a0, a1 = 2 * math.pi * k / 8, 2 * math.pi * (k + 1) / 8
        p0 = (ux + r * math.cos(a0), uz + r * math.sin(a0))
        p1 = (ux + r * math.cos(a1), uz + r * math.sin(a1))
        mid = (a0 + a1) / 2
        light = 0.65 + 0.35 * max(0.0, -math.sin(mid)) + 0.15 * max(0.0, -math.cos(mid))
        col = tuple(int(c * light) for c in (70, 92, 80))
        s.quad([(p0[0], 0, p0[1]), (p1[0], 0, p1[1]), (p1[0], 0.7, p1[1]), (p0[0], 0.7, p0[1])], col, bias=0.3)
    s.disc_on_wall((ux, 0.7, uz), r, (1, 0, 0), (0, 0, 1), (30, 24, 18), 8, bias=0.4)  # dark mouth
    for k, (dx, dz, lean, col) in enumerate(((-0.07, 0.04, -0.1, (30, 30, 38)), (0.06, 0.05, 0.08, (74, 30, 30)),
                                             (0.0, -0.05, 0.0, (40, 40, 44)))):
        # a furled umbrella: a fat canopy tapering to the shaft, a hooked wooden handle on top
        base = (ux + dx, 0.45, uz + dz)
        mid = (ux + dx + lean * 0.6, 1.2 - 0.07 * k, uz + dz)
        top = (ux + dx + lean, 1.4 - 0.07 * k, uz + dz)
        s.beam(base, mid, 0.13, col, bias=0.6)
        s.beam(mid, top, 0.03, (70, 66, 60), bias=0.6)
        hook = (top[0] + 0.07, top[1] + 0.05, top[2])
        s.beam(top, hook, 0.03, (110, 72, 40), bias=0.7)
        s.beam(hook, (hook[0] + 0.04, hook[1] - 0.06, hook[2]), 0.03, (110, 72, 40), bias=0.7)
    rng = random.Random(17)
    for _ in range(8):  # dead leaves spilling over the rim and on the floor
        a, rr_ = rng.uniform(0, 2 * math.pi), rng.uniform(0.0, 0.3)
        lx, lz = ux + rr_ * math.cos(a), uz - abs(rr_ * math.sin(a))
        y = 0.71 if rr_ < 0.15 else 0.004
        col = rng.choice([(130, 76, 30), (110, 60, 26), (150, 100, 40)])
        s.quad([(lx - 0.04, y, lz), (lx, y, lz - 0.03), (lx + 0.04, y, lz), (lx, y, lz + 0.03)], col, bias=0.8)

    # grandfather clock against the x = ROOM wall
    z0, z1 = 2.35, 2.95
    xb = R - 0.36
    case = (96, 52, 30)
    s.box(xb, R, 0, 0.35, z0 - 0.04, z1 + 0.04, (78, 42, 24))  # plinth
    s.box(xb + 0.04, R, 0.35, 1.6, z0 + 0.04, z1 - 0.04, case)  # trunk
    s.box(xb - 0.02, R, 1.6, 2.2, z0 - 0.04, z1 + 0.04, case)  # hood
    s.box(xb - 0.04, R, 2.2, 2.3, z0 - 0.08, z1 + 0.08, (70, 38, 22))  # crown
    xf = xb + 0.035
    # glass door in the trunk, pendulum behind it
    rr.wall_quad(s, "xR", z0 + 0.12, z1 - 0.12, 0.45, 1.5, (44, 30, 24), inset=R - xf + 0.002, bias=0.5)
    s.beam((xf + 0.01, 1.48, (z0 + z1) / 2), (xf + 0.01, 0.75, (z0 + z1) / 2), 0.02, (170, 140, 70), bias=0.6)
    s.disc_on_wall((xf - 0.002, 0.72, (z0 + z1) / 2), 0.08, (0, 0, 1), (0, 1, 0), (190, 160, 80), 8, bias=0.7)
    for zz in (z0 + 0.12, z1 - 0.15):
        rr.wall_quad(s, "xR", zz, zz + 0.03, 0.45, 1.5, (120, 74, 40), inset=R - xf + 0.003, bias=0.65)
    s.box(xf - 0.03, xf, 0.95, 1.05, z1 - 0.16, z1 - 0.12, (180, 150, 80), bias=0.8)  # door latch
    # clock face in the hood
    face_x = xb - 0.025
    c = (face_x, 1.9, (z0 + z1) / 2)
    s.disc_on_wall(c, 0.22, (0, 0, 1), (0, 1, 0), (200, 188, 150), 12, bias=1)
    for i in range(12):
        a = 2 * math.pi * i / 12
        s.disc_on_wall((face_x - 0.002, c[1] + 0.18 * math.sin(a), c[2] + 0.18 * math.cos(a)), 0.014,
                       (0, 0, 1), (0, 1, 0), (40, 34, 28), 4, bias=1.5)
    s.beam((face_x - 0.004, c[1], c[2]), (face_x - 0.004, c[1] + 0.15, c[2] + 0.02), 0.018, (20, 16, 14), bias=2)
    s.beam((face_x - 0.004, c[1], c[2]), (face_x - 0.004, c[1] - 0.04, c[2] - 0.1), 0.022, (20, 16, 14), bias=2)


def foyer_c(s):
    """Front door with iron/silver/gold lock plates on z = 0, chandelier, winch on x = 0."""
    # grey dawn light leaking under the door
    s.quad([(0.9, 0.003, 0.0), (2.5, 0.003, 0.0), (2.65, 0.003, 0.45), (0.75, 0.003, 0.45)], (90, 94, 104), bias=-43)
    # door frame and two leaves
    rr.wall_quad(s, "z0", 0.6, 2.8, 0, 2.5, (110, 100, 86), inset=0.003, bias=0.45)  # stone architrave
    rr.wall_quad(s, "z0", 0.75, 2.65, 0, 2.4, (54, 36, 24), inset=0.004, bias=0.5)
    s.box(0.55, 2.85, 2.4, 2.52, 0, 0.12, (120, 110, 94), bias=0.6)  # lintel
    for x0, x1 in ((0.85, 1.69), (1.71, 2.55)):
        rr.wall_quad(s, "z0", x0, x1, 0, 2.3, (104, 64, 36), inset=0.008, bias=1)
        for y0, y1 in ((0.2, 0.95), (1.15, 2.1)):
            rr.wall_quad(s, "z0", x0 + 0.1, x1 - 0.1, y0, y1, (84, 50, 28), inset=0.010, bias=1.2)
    rr.wall_quad(s, "z0", 1.69, 1.71, 0, 2.3, (30, 20, 14), inset=0.009, bias=1.3)  # seam
    # three lock plates down the seam: iron (top), silver, gold (bottom)
    for y, plate, hole in ((1.65, (74, 74, 80), (14, 14, 14)), (1.25, (186, 190, 198), (30, 30, 34)),
                           (0.85, (214, 172, 60), (40, 28, 10))):
        s.box(1.6, 1.8, y - 0.11, y + 0.11, 0.0, 0.05, plate, bias=1.5)
        rr.wall_quad(s, "z0", 1.685, 1.715, y - 0.06, y + 0.03, hole, inset=0.052, bias=1.8)
        s.disc_on_wall((1.7, y + 0.035, 0.052), 0.025, (1, 0, 0), (0, 1, 0), hole, 6, bias=1.8)
    # heavy ring handles
    for x in (1.35, 2.05):
        s.disc_on_wall((x, 1.1, 0.012), 0.07, (1, 0, 0), (0, 1, 0), (40, 36, 30), 8, bias=1.6)
        s.disc_on_wall((x, 1.1, 0.014), 0.045, (1, 0, 0), (0, 1, 0), (84, 50, 28), 8, bias=1.7)
    # fanlight over the door, pale with dawn
    pts = [(1.7 + 0.8 * math.cos(a), 2.52 + 0.06 * math.sin(a), 0.006)
           for a in (math.pi * i / 8 for i in range(9))]
    s.quad(pts, (110, 118, 130), bias=0.7)

    # winch on the x = 0 wall, chain running up to the ceiling
    wz, wy = 2.05, 1.15
    s.box(0.0, 0.08, wy - 0.3, wy + 0.3, wz - 0.25, wz + 0.25, (64, 60, 56))  # wall plate
    s.box(0.08, 0.38, wy - 0.12, wy + 0.12, wz - 0.18, wz - 0.13, (90, 86, 80))  # bracket
    s.box(0.08, 0.38, wy - 0.12, wy + 0.12, wz + 0.13, wz + 0.18, (90, 86, 80))
    s.box(0.12, 0.34, wy - 0.13, wy + 0.13, wz - 0.13, wz + 0.13, (110, 70, 40), bias=0.2)  # drum with chain
    for k in range(4):
        y = wy - 0.1 + k * 0.065
        s.box(0.115, 0.345, y, y + 0.03, wz - 0.12, wz + 0.12, (140, 136, 128), bias=0.3)
    s.box(0.36, 0.42, wy - 0.05, wy + 0.05, wz + 0.18, wz + 0.24, (24, 22, 20), bias=0.4)  # empty square socket
    s.beam((0.23, wy + 0.13, wz), (0.23, H, wz), 0.03, (120, 116, 108))
    # chain along the ceiling to the chandelier
    cx, cz = 1.9, 1.5
    s.beam((0.23, H - 0.03, wz), (cx, H - 0.03, cz), 0.03, (120, 116, 108), bias=-5)

    # crystal chandelier hanging high
    top, ring_y = H - 0.03, 1.95
    s.beam((cx, top, cz), (cx, ring_y + 0.25, cz), 0.025, (120, 116, 108))
    s.box(cx - 0.05, cx + 0.05, ring_y - 0.05, ring_y + 0.28, cz - 0.05, cz + 0.05, (120, 100, 72))
    for k in range(8):
        a = 2 * math.pi * k / 8
        px, pz = cx + 0.42 * math.cos(a), cz + 0.42 * math.sin(a)
        s.beam((cx, ring_y + 0.05, cz), (px, ring_y, pz), 0.03, (120, 100, 72), bias=0.2)
        s.box(px - 0.025, px + 0.025, ring_y, ring_y + 0.1, pz - 0.025, pz + 0.025, (210, 200, 170), bias=0.3)  # candle
        for d in (0.2, 0.32):  # dangling crystals
            qx, qz = cx + (0.42 - d * 0.5) * math.cos(a + 0.4), cz + (0.42 - d * 0.5) * math.sin(a + 0.4)
            s.box(qx - 0.02, qx + 0.02, ring_y - d, ring_y - d + 0.1, qz - 0.02, qz + 0.02, (190, 204, 214), bias=0.4)
    s.box(cx - 0.04, cx + 0.04, ring_y - 0.42, ring_y - 0.05, cz - 0.04, cz + 0.04, (190, 204, 214), bias=0.35)
    # the gold glint among the crystals
    gx, gz = cx + 0.3, cz - 0.05
    s.beam((gx, ring_y, gz), (gx, ring_y - 0.12, gz), 0.012, (140, 40, 40), bias=0.6)  # ribbon
    s.box(gx - 0.05, gx + 0.05, ring_y - 0.24, ring_y - 0.12, gz - 0.05, gz + 0.05, (255, 220, 80), bias=0.7)


ROOM = dict(
    a=[shell, foyer_a],
    c=[shell, foyer_c],
    light_a=(150, 80),
    light_c=(170, 90),
    light=rr.WARM,
)
