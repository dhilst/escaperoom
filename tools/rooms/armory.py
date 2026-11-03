"""The Trophy Room: a suit of armour holding a shield by a cold fireplace, crossed swords and a
stag head (A); glass display case, crest board between gas sconces, weapons rack and the door (C)."""

import random

import render_rooms as rr

R, H = rr.ROOM, rr.HEIGHT


def shell(s, far_walls):
    """Dark oak panelling below a green damask wall, oak floor with a red runner."""
    rr.walls_floor(s, (84, 60, 40), (40, 34, 28), (58, 74, 58), (70, 88, 68))
    for k in range(1, 14):  # floorboards
        z = R * k / 14
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], (56, 40, 28), bias=-45)
    s.quad([(1.0, 0.003, 1.0), (3.0, 0.003, 1.0), (3.0, 0.003, 3.0), (1.0, 0.003, 3.0)], (96, 30, 30), bias=-44)
    s.quad([(1.1, 0.004, 1.1), (2.9, 0.004, 1.1), (2.9, 0.004, 2.9), (1.1, 0.004, 2.9)], (120, 44, 36), bias=-43)
    rng = random.Random(15)
    for wall in far_walls:
        rr.wall_quad(s, wall, 0, R, 0, 1.0, (78, 52, 34), inset=0.002, bias=-39)  # panelling
        rr.wall_quad(s, wall, 0, R, 0.98, 1.06, (108, 74, 46), inset=0.003, bias=-38.5)  # dado rail
        u = 0.1
        while u < R - 0.4:
            rr.wall_quad(s, wall, u, u + 0.5, 0.15, 0.85, (66, 44, 28), inset=0.003, bias=-38.6)
            u += 0.62
        for _ in range(14):  # damask pattern
            u, y = rng.uniform(0.2, R - 0.2), rng.uniform(1.25, 2.4)
            c = {"zR": (u, y, R - 0.003), "z0": (u, y, 0.003), "xR": (R - 0.003, y, u), "x0": (0.003, y, u)}[wall]
            axis = (1, 0, 0) if wall[0] == "z" else (0, 0, 1)
            s.disc_on_wall(c, 0.07, axis, (0, 1.4, 0), (82, 100, 76), 4, bias=-38)
        rr.wall_quad(s, wall, 0, R, H - 0.1, H, (100, 70, 44), inset=0.003, bias=-38.5)  # cornice


def armory_a(s):
    """Fireplace with crossed swords above on z = R; suit of armour beside it; stag head on x = R."""
    stone, stone_dark = (112, 104, 94), (78, 72, 66)
    # fireplace surround and hearth
    s.box(0.8, 2.4, 0, 0.06, R - 0.8, R, stone_dark)  # hearth slab
    s.box(0.8, 1.05, 0.06, 1.15, R - 0.32, R, stone)
    s.box(2.15, 2.4, 0.06, 1.15, R - 0.32, R, stone)
    s.box(0.72, 2.48, 1.15, 1.27, R - 0.4, R, (124, 116, 104))  # mantel shelf
    s.box(1.05, 2.15, 0.85, 1.15, R - 0.3, R, stone)  # lintel
    rr.wall_quad(s, "zR", 1.05, 2.15, 0.06, 0.85, (18, 14, 12), inset=0.12, bias=0.5)  # firebox
    s.box(1.15, 2.05, 0.06, 0.12, R - 0.45, R - 0.2, (40, 36, 34), bias=0.6)  # grate
    for gx in (1.2, 1.95):  # fire-dogs
        s.box(gx, gx + 0.08, 0.06, 0.32, R - 0.5, R - 0.42, (50, 46, 44), bias=0.8)
        s.box(gx - 0.02, gx + 0.1, 0.3, 0.36, R - 0.56, R - 0.4, (60, 56, 52), bias=0.9)
    s.quad([(1.25, 0.125, R - 0.4), (1.95, 0.125, R - 0.4), (1.9, 0.125, R - 0.22), (1.3, 0.125, R - 0.22)],
           (70, 66, 62), bias=0.7)  # ashes
    # crossed swords above the mantel
    steel, grip = (186, 190, 196), (70, 40, 26)
    for (x0, y0), (x1, y1) in (((1.05, 1.42), (2.1, 2.12)), ((2.1, 1.42), (1.05, 2.12))):
        s.beam((x0, y0, R - 0.03), (x1, y1, R - 0.03), 0.045, steel, bias=0.5)
        gx, gy = x0 + (x1 - x0) * 0.04, y0 + (y1 - y0) * 0.04
        cx, cy = x0 + (x1 - x0) * 0.16, y0 + (y1 - y0) * 0.16
        s.beam((x0 - (x1 - x0) * 0.08, y0 - (y1 - y0) * 0.08, R - 0.035), (cx, cy, R - 0.035), 0.06, grip, bias=0.7)
        s.beam((cx - 0.12, cy + 0.08 * (1 if x1 > x0 else -1) * 1.5, R - 0.04),
               (cx + 0.12, cy - 0.08 * (1 if x1 > x0 else -1) * 1.5, R - 0.04), 0.04, (190, 160, 70), bias=0.8)
        s.box(gx - 0.04, gx + 0.04, gy - 0.04, gy + 0.04, R - 0.08, R - 0.02, (190, 160, 70), bias=0.9)

    # suit of armour on a plinth, right of the fireplace, holding a kite shield
    metal, metal_dark = (150, 152, 158), (96, 98, 104)
    ax, az = 3.05, R - 0.55
    s.box(ax - 0.35, ax + 0.35, 0, 0.12, az - 0.3, az + 0.3, (70, 50, 34))  # plinth
    for lx in (ax - 0.15, ax + 0.05):
        s.box(lx, lx + 0.12, 0.12, 0.2, az - 0.14, az + 0.06, metal_dark)  # sabatons
        s.box(lx + 0.01, lx + 0.11, 0.2, 0.92, az - 0.05, az + 0.06, metal)  # legs
    s.box(ax - 0.2, ax + 0.2, 0.88, 1.06, az - 0.09, az + 0.1, metal_dark)  # tassets
    s.box(ax - 0.19, ax + 0.19, 1.06, 1.5, az - 0.11, az + 0.1, metal)  # breastplate
    s.box(ax - 0.27, ax + 0.27, 1.42, 1.56, az - 0.1, az + 0.1, metal_dark)  # pauldrons
    s.box(ax - 0.09, ax + 0.09, 1.56, 1.84, az - 0.1, az + 0.08, metal)  # helmet
    rr.wall_quad(s, "zR", ax - 0.07, ax + 0.07, 1.68, 1.71, (16, 14, 14), inset=R - az + 0.102, bias=2)  # visor slit
    s.box(ax - 0.015, ax + 0.015, 1.84, 1.95, az - 0.04, az + 0.04, (150, 30, 30), bias=0.5)  # plume
    # right arm hangs by its side
    s.box(ax - 0.29, ax - 0.2, 0.95, 1.45, az - 0.05, az + 0.05, metal)
    s.box(ax - 0.3, ax - 0.19, 0.88, 0.97, az - 0.07, az + 0.06, metal_dark)
    # left arm bent forward, the shield strapped to it
    s.box(ax + 0.2, ax + 0.29, 1.1, 1.45, az - 0.05, az + 0.05, metal)
    s.box(ax + 0.2, ax + 0.29, 1.08, 1.17, az - 0.25, az + 0.02, metal)
    zs = az - 0.29
    sx0, sx1, top, mid, tip = ax - 0.04, ax + 0.6, 1.55, 1.12, 0.55
    smid = (sx0 + sx1) / 2
    s.quad([(sx0, top, zs), (sx1, top, zs), (sx1, mid, zs), (smid, tip, zs), (sx0, mid, zs)], (60, 50, 40), bias=1.5)
    zs -= 0.004
    s.quad([(sx0 + 0.04, top - 0.04, zs), (sx1 - 0.04, top - 0.04, zs), (sx1 - 0.04, mid, zs), (smid, tip + 0.07, zs),
            (sx0 + 0.04, mid, zs)], (40, 60, 120), bias=1.6)  # field
    zs -= 0.003
    ym = (top + mid) / 2 - 0.02
    for (u0, u1, v0, v1, col) in ((sx0 + 0.07, smid - 0.02, ym + 0.02, top - 0.07, (190, 160, 70)),
                                  (smid + 0.02, sx1 - 0.07, ym + 0.02, top - 0.07, (150, 40, 36)),
                                  (sx0 + 0.07, smid - 0.02, mid - 0.06, ym - 0.02, (150, 40, 36)),
                                  (smid + 0.02, sx1 - 0.07, mid - 0.06, ym - 0.02, (190, 160, 70))):
        s.quad([(u0, v0, zs), (u1, v0, zs), (u1, v1, zs), (u0, v1, zs)], col, bias=1.7)
    s.box(sx0, sx1, 1.0, 1.05, zs - 0.03, zs + 0.02, (90, 60, 34), bias=1.9)  # leather strap

    # mounted stag head on the x = R wall
    sz = 2.0
    s.box(R - 0.04, R, 1.55, 2.0, sz - 0.24, sz + 0.24, (88, 56, 32))  # shield-shaped mount
    s.box(R - 0.2, R - 0.04, 1.62, 1.88, sz - 0.1, sz + 0.1, (110, 80, 52))  # neck
    s.box(R - 0.42, R - 0.18, 1.62, 1.8, sz - 0.08, sz + 0.08, (120, 88, 58))  # head
    s.box(R - 0.48, R - 0.4, 1.62, 1.7, sz - 0.05, sz + 0.05, (60, 42, 30))  # muzzle
    for dz in (-0.085, 0.085):
        s.box(R - 0.36, R - 0.32, 1.73, 1.77, sz + dz - 0.012, sz + dz + 0.012, (10, 10, 10), bias=0.5)  # glass eyes
        side = 1 if dz > 0 else -1
        base = (R - 0.24, 1.8, sz + side * 0.06)
        tip = (R - 0.3, 2.3, sz + side * 0.42)
        s.beam(base, tip, 0.035, (200, 186, 150), bias=0.4)
        for t, dy, dzz in ((0.35, 0.16, 0.0), (0.6, 0.18, 0.12), (0.85, 0.12, 0.05)):
            p = tuple(base[k] + (tip[k] - base[k]) * t for k in range(3))
            s.beam(p, (p[0] - 0.05, p[1] + dy, p[2] + side * dzz), 0.025, (200, 186, 150), bias=0.45)


def armory_c(s):
    """Crest board between gas sconces and a glass display case on z = 0; door and weapons rack on x = 0."""
    oak = (110, 74, 44)
    # crest board: a carved oak panel with an empty hook and a pale shield outline
    bx0, bx1 = 1.15, 2.35
    rr.wall_quad(s, "z0", bx0, bx1, 1.05, 2.3, (70, 46, 28), inset=0.004, bias=0.5)
    rr.wall_quad(s, "z0", bx0 + 0.05, bx1 - 0.05, 1.1, 2.25, oak, inset=0.03, bias=0.6)
    s.box(bx0, bx1, 1.05, 2.3, 0.0, 0.03, (70, 46, 28))
    cx = (bx0 + bx1) / 2
    z = 0.034
    s.quad([(cx - 0.3, 2.05, z), (cx + 0.3, 2.05, z), (cx + 0.3, 1.65, z), (cx, 1.2, z), (cx - 0.3, 1.65, z)],
           (150, 116, 80), bias=1)  # sun-pale outline of the missing shield
    s.quad([(cx - 0.26, 2.01, z + 0.002), (cx + 0.26, 2.01, z + 0.002), (cx + 0.26, 1.66, z + 0.002),
            (cx, 1.27, z + 0.002), (cx - 0.26, 1.66, z + 0.002)], (128, 92, 58), bias=1.1)
    s.box(cx - 0.03, cx + 0.03, 1.98, 2.1, z, z + 0.08, (50, 48, 46), bias=1.5)  # iron hook
    s.box(cx - 0.03, cx + 0.03, 2.06, 2.1, z + 0.06, z + 0.11, (50, 48, 46), bias=1.6)
    # four carved beasts in the corners, and the motto band below
    for ux, uy in ((bx0 + 0.18, 2.05), (bx1 - 0.18, 2.05), (bx0 + 0.18, 1.35), (bx1 - 0.18, 1.35)):
        s.disc_on_wall((ux, uy, z + 0.003), 0.1, (1, 0, 0), (0, 1, 0), (84, 56, 34), 8, bias=1.2)
        s.disc_on_wall((ux, uy, z + 0.005), 0.06, (1, 0, 0), (0, 1, 0), (140, 104, 64), 6, bias=1.3)
    rr.wall_quad(s, "z0", bx0 + 0.15, bx1 - 0.15, 1.13, 1.2, (60, 40, 24), inset=z + 0.003, bias=1.2)
    # two unlit brass gas sconces
    brass = (180, 150, 80)
    for sx in (bx0 - 0.25, bx1 + 0.25):
        s.box(sx - 0.06, sx + 0.06, 1.62, 1.8, 0.0, 0.04, brass)
        s.beam((sx, 1.7, 0.03), (sx, 1.8, 0.2), 0.03, brass, bias=0.4)
        s.box(sx - 0.07, sx + 0.07, 1.8, 1.84, 0.13, 0.27, brass, bias=0.5)
        s.box(sx - 0.06, sx + 0.06, 1.84, 2.04, 0.14, 0.26, (176, 180, 170), bias=0.6)  # cold glass globe

    # glass display case on legs, a knife on velvet inside
    x0, x1, z0, z1 = 2.75, 3.55, 0.2, 0.75
    for lx in (x0, x1 - 0.05):
        for lz in (z0, z1 - 0.05):
            s.box(lx, lx + 0.05, 0, 0.8, lz, lz + 0.05, (80, 52, 32))
    s.box(x0, x1, 0.8, 0.9, z0, z1, (96, 64, 38))
    s.box(x0 + 0.05, x1 - 0.05, 0.9, 0.92, z0 + 0.05, z1 - 0.05, (110, 26, 34), bias=0.3)  # velvet
    s.box(x0 + 0.2, x1 - 0.32, 0.92, 0.94, 0.45, 0.5, (190, 196, 204), bias=0.6)  # blade
    s.box(x1 - 0.32, x1 - 0.17, 0.92, 0.95, 0.44, 0.51, (200, 180, 140), bias=0.6)  # horn grip
    for (a, b) in (((x0, 0.9, z1), (x0, 1.2, z1)), ((x1, 0.9, z1), (x1, 1.2, z1)),
                   ((x0, 0.9, z0), (x0, 1.2, z0)), ((x1, 0.9, z0), (x1, 1.2, z0)),
                   ((x0, 1.2, z1), (x1, 1.2, z1)), ((x0, 1.2, z0), (x1, 1.2, z0)),
                   ((x0, 1.2, z0), (x0, 1.2, z1)), ((x1, 1.2, z0), (x1, 1.2, z1))):
        s.beam(a, b, 0.025, (96, 64, 38), bias=0.8)  # frame
    s.quad([(x0, 1.2, z0), (x1, 1.2, z0), (x1, 1.2, z1), (x0, 1.2, z1)], (120, 140, 140), bias=0.7)  # glass lid

    # iron-bound door on the x = 0 wall
    rr.wall_quad(s, "x0", 1.75, 2.85, 0, 2.2, (50, 36, 26), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.82, 2.78, 0, 2.12, (96, 64, 40), inset=0.006, bias=1)
    for zz in (2.06, 2.3, 2.54):
        rr.wall_quad(s, "x0", zz, zz + 0.015, 0, 2.12, (64, 42, 28), inset=0.008, bias=1.2)
    for y in (0.3, 1.0, 1.75):
        rr.wall_quad(s, "x0", 1.82, 2.78, y, y + 0.09, (44, 42, 42), inset=0.009, bias=1.4)
        for zz in (1.9, 2.3, 2.7):
            s.box(0.006, 0.03, y + 0.03, y + 0.06, zz, zz + 0.03, (90, 88, 86), bias=1.6)  # rivets
    s.box(0.006, 0.08, 1.2, 1.26, 2.55, 2.7, (60, 58, 56), bias=1.6)  # ring pull

    # weapons rack on the x = 0 wall: spears, a halberd and two axes behind a chain
    wood = (90, 60, 36)
    s.box(0.0, 0.25, 0.2, 0.3, 0.35, 1.35, wood)
    s.box(0.0, 0.25, 1.4, 1.5, 0.35, 1.35, wood)
    for zz in (0.45, 0.65, 0.85, 1.05, 1.25):
        top = 2.2 if zz != 0.85 else 2.05
        s.beam((0.13, 0.25, zz), (0.13, top, zz), 0.04, (100, 72, 44), bias=0.4)
        s.quad([(0.13, top, zz - 0.04), (0.13, top, zz + 0.04), (0.13, top + 0.2, zz)], (180, 184, 190), bias=0.6)
    s.quad([(0.14, 1.85, 0.85), (0.14, 1.85, 1.05), (0.14, 2.05, 1.02), (0.14, 2.05, 0.85)],
           (180, 184, 190), bias=0.7)  # halberd blade
    s.box(0.2, 0.3, 0.6, 0.62, 0.4, 1.3, (60, 58, 56), bias=0.8)  # chain bar
    for zz, dy in ((0.55, 0.0), (1.15, 0.0)):  # two axes hung on pegs below
        s.beam((0.12, 0.7, zz), (0.12, 1.3, zz), 0.035, (110, 78, 46), bias=0.9)
        s.quad([(0.13, 1.12, zz), (0.13, 1.3, zz), (0.13, 1.34, zz + 0.16), (0.13, 1.06, zz + 0.16)],
               (170, 172, 176), bias=1.0)


ROOM = dict(
    a=[lambda s: shell(s, ("zR", "xR")), armory_a],
    c=[lambda s: shell(s, ("z0", "x0")), armory_c],
    light_a=(140, 130),
    light_c=(170, 100),
    light=rr.WARM,
)
