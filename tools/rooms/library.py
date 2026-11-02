"""The Library: bookshelves with a gap, cold fireplace and portrait (camera A);
reading table with a chained atlas, a cart of returns and a tall window (camera C)."""

import random

import render_rooms as rr

R, HH = rr.ROOM, rr.HEIGHT
SPINES = [(120, 40, 34), (52, 84, 62), (140, 110, 60), (66, 60, 110), (110, 86, 62),
          (150, 70, 40), (40, 70, 90), (130, 120, 96), (90, 40, 70)]
WOOD = (92, 60, 36)
DARK_WOOD = (62, 40, 24)


def shell(s):
    rr.walls_floor(s, (96, 66, 44), (46, 38, 32), (96, 78, 58), (116, 94, 68))
    # wainscot along the bottom of every wall, floorboards
    for wall in ("z0", "zR", "x0", "xR"):
        rr.wall_quad(s, wall, 0, R, 0, 0.9, (82, 56, 36), inset=0.002, bias=-39)
        rr.wall_quad(s, wall, 0, R, 0.9, 0.95, (60, 40, 26), inset=0.003, bias=-38.5)
    for k in range(1, 12):
        z = R * k / 12
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.025), (0, 0.001, z + 0.025)], (64, 44, 30), bias=-45)
    # faded runner rug
    s.quad([(1.2, 0.003, 0.8), (2.8, 0.003, 0.8), (2.8, 0.003, 3.2), (1.2, 0.003, 3.2)], (100, 40, 34), bias=-44)
    s.quad([(1.3, 0.004, 0.9), (2.7, 0.004, 0.9), (2.7, 0.004, 3.1), (1.3, 0.004, 3.1)], (124, 58, 42), bias=-43)


def books_on_wall(s, wall, u0, u1, y0, inset, rng, gap=None):
    """A row of colorful spines on a wall-facing shelf; `gap` = (ua, ub) left empty."""
    u = u0
    while u < u1 - 0.04:
        w = rng.uniform(0.045, 0.1)
        if gap and gap[0] - w < u < gap[1]:
            u = gap[1]
            continue
        h = rng.uniform(0.24, 0.36)
        col = rng.choice(SPINES)
        rr.wall_quad(s, wall, u, min(u + w, u1), y0, y0 + h, col, inset=inset, bias=1)
        if rng.random() < 0.25:  # a gilt band on the spine
            rr.wall_quad(s, wall, u, min(u + w, u1), y0 + h * 0.75, y0 + h * 0.8, (150, 120, 60),
                         inset=inset + 0.001, bias=1.2)
        u += w + 0.006


def library_a(s):
    """Bookshelves on the z = R wall, fireplace and portrait on the x = R wall."""
    rng = random.Random(6)
    depth = 0.38
    # two tall bookcases; the right one holds the gap
    for (x0, x1) in ((0.2, 1.55), (1.65, 3.1)):
        s.box(x0, x1, 0, 2.4, R - depth, R, WOOD)
        for i in range(5):
            y0 = 0.1 + i * 0.46
            rr.wall_quad(s, "zR", x0 + 0.06, x1 - 0.06, y0, y0 + 0.4, (30, 20, 14), inset=depth + 0.001, bias=0.5)
            gap = (2.15, 2.6) if (x0 > 1 and i == 2) else None
            books_on_wall(s, "zR", x0 + 0.07, x1 - 0.07, y0, depth + 0.003, rng, gap)
        s.box(x0 - 0.03, x1 + 0.03, 2.4, 2.5, R - depth - 0.05, R, DARK_WOOD)  # cornice
    # the gap: pitch dark, with a brass label under it
    y0 = 0.1 + 2 * 0.46
    rr.wall_quad(s, "zR", 2.15, 2.6, y0, y0 + 0.4, (8, 6, 6), inset=depth + 0.004, bias=1.4)
    s.box(2.17, 2.58, y0 - 0.12, y0 - 0.01, R - depth - 0.03, R - depth, (230, 190, 80), bias=1.6)
    rr.wall_quad(s, "zR", 2.22, 2.53, y0 - 0.08, y0 - 0.05, (80, 50, 16), inset=depth + 0.032, bias=1.7)
    # fireplace on the x = R wall
    zc = 2.2
    s.box(R - 0.35, R, 0, 1.1, zc - 0.75, zc + 0.75, (120, 110, 100))  # stone surround
    s.box(R - 0.45, R, 1.1, 1.2, zc - 0.85, zc + 0.85, (90, 82, 76))  # mantel
    rr.wall_quad(s, "xR", zc - 0.45, zc + 0.45, 0, 0.75, (16, 12, 10), inset=0.352, bias=1)  # firebox
    for k in range(4):  # grate bars
        z = zc - 0.3 + k * 0.2
        rr.wall_quad(s, "xR", z, z + 0.04, 0.05, 0.35, (50, 46, 44), inset=0.355, bias=1.5)
    s.box(R - 0.55, R - 0.36, 0, 0.06, zc - 0.35, zc + 0.35, (70, 64, 60), bias=1)  # ash pile
    # candlesticks on the mantel
    for z in (zc - 0.6, zc + 0.6):
        s.box(R - 0.3, R - 0.24, 1.2, 1.45, z - 0.03, z + 0.03, (200, 190, 160), bias=1)
    # portrait of the old librarian above the mantel
    rr.wall_quad(s, "xR", zc - 0.42, zc + 0.42, 1.45, 2.4, (150, 110, 50), inset=0.004, bias=1)
    rr.wall_quad(s, "xR", zc - 0.35, zc + 0.35, 1.52, 2.33, (40, 34, 30), inset=0.006, bias=1.2)
    rr.wall_quad(s, "xR", zc - 0.28, zc + 0.28, 1.52, 1.85, (30, 26, 28), inset=0.008, bias=1.4)  # dark coat
    s.disc_on_wall((R - 0.01, 2.02, zc), 0.13, (0, 0, 1), (0, 1.2, 0), (190, 160, 130), 10, bias=1.6)  # face
    rr.wall_quad(s, "xR", zc - 0.13, zc + 0.13, 2.13, 2.2, (200, 200, 196), inset=0.012, bias=1.8)  # white hair
    rr.wall_quad(s, "xR", zc - 0.03, zc + 0.03, 1.85, 1.92, (210, 210, 200), inset=0.012, bias=1.8)  # collar
    for dz in (-0.05, 0.05):
        rr.wall_quad(s, "xR", zc + dz - 0.015, zc + dz + 0.015, 2.03, 2.06, (30, 20, 16), inset=0.013, bias=1.9)


def library_c(s):
    """Tall window and reading table on the z = 0 wall, book cart by the x = 0 wall."""
    rng = random.Random(14)
    # tall window
    xw = 2.55
    rr.wall_quad(s, "z0", xw - 0.55, xw + 0.55, 0.85, 2.45, DARK_WOOD, inset=0.004, bias=0.5)
    rr.wall_quad(s, "z0", xw - 0.47, xw + 0.47, 0.93, 2.37, (40, 52, 76), inset=0.006, bias=1)
    rr.wall_quad(s, "z0", xw - 0.025, xw + 0.025, 0.93, 2.37, DARK_WOOD, inset=0.008, bias=1.5)
    for y in (1.4, 1.9):
        rr.wall_quad(s, "z0", xw - 0.47, xw + 0.47, y, y + 0.04, DARK_WOOD, inset=0.008, bias=1.5)
    for k in range(5):  # rain streaks
        x = xw - 0.4 + k * 0.19
        rr.wall_quad(s, "z0", x, x + 0.012, 1.0 + 0.1 * (k % 3), 2.2 - 0.12 * (k % 2), (70, 86, 110),
                     inset=0.007, bias=1.2)
    s.box(xw - 0.6, xw + 0.6, 0.82, 0.88, 0, 0.14, (110, 76, 46))  # sill
    # reading table
    tx0, tx1, tz0, tz1 = 1.0, 2.9, 0.35, 1.25
    s.box(tx0, tx1, 0.72, 0.8, tz0, tz1, (110, 70, 42))
    for lx in (tx0 + 0.05, tx1 - 0.13):
        for lz in (tz0 + 0.05, tz1 - 0.13):
            s.box(lx, lx + 0.08, 0, 0.72, lz, lz + 0.08, DARK_WOOD)
    # the huge star atlas, open: two pale pages on a dark-blue binding
    ax0, ax1, az0, az1 = 1.3, 2.45, 0.45, 1.15
    s.box(ax0, ax1, 0.8, 0.86, az0, az1, (34, 40, 90), bias=0.5)
    s.box(ax0 + 0.04, (ax0 + ax1) / 2 - 0.01, 0.86, 0.9, az0 + 0.03, az1 - 0.03, (210, 196, 150), bias=0.7)
    s.box((ax0 + ax1) / 2 + 0.01, ax1 - 0.04, 0.86, 0.9, az0 + 0.03, az1 - 0.03, (210, 196, 150), bias=0.7)
    # star dots and constellation lines on the pages
    for _ in range(22):
        x = rng.uniform(ax0 + 0.08, ax1 - 0.08)
        if abs(x - (ax0 + ax1) / 2) < 0.04:
            continue
        z = rng.uniform(az0 + 0.08, az1 - 0.08)
        s.quad([(x, 0.902, z), (x + 0.03, 0.902, z), (x + 0.03, 0.902, z + 0.03), (x, 0.902, z + 0.03)],
               (40, 40, 90), bias=0.9)
    # heavy chain from the atlas to the table edge, with a small brass padlock
    links = [(ax1 - 0.05, 0.89, az0 + 0.3), (2.55, 0.83, 0.75), (2.75, 0.81, 0.85), (2.9, 0.7, 0.9), (2.92, 0.5, 0.88)]
    for a, b in zip(links, links[1:]):
        s.beam(a, b, 0.035, (150, 150, 150), bias=0.9)
    s.box(2.48, 2.64, 0.8, 0.96, 0.7, 0.82, (220, 180, 70), bias=1.2)  # padlock body
    s.beam((2.5, 0.96, 0.76), (2.62, 0.96, 0.76), 0.025, (180, 180, 180), bias=1.3)  # shackle
    # chair pulled out
    s.box(1.7, 2.2, 0.44, 0.49, 1.45, 1.9, DARK_WOOD)
    s.box(1.7, 2.2, 0.49, 1.05, 1.86, 1.92, DARK_WOOD)
    for lx in (1.72, 2.14):
        for lz in (1.47, 1.84):
            s.box(lx, lx + 0.04, 0, 0.44, lz, lz + 0.04, (50, 32, 20))
    # book cart of returns against the x = 0 wall
    cx0, cx1, cz0, cz1 = 0.15, 0.75, 1.6, 2.9
    for y in (0.25, 0.75):
        s.box(cx0, cx1, y, y + 0.05, cz0, cz1, (120, 84, 50))
    for x in (cx0, cx1 - 0.05):
        for z in (cz0, cz1 - 0.05):
            s.box(x, x + 0.05, 0.08, 1.0, z, z + 0.05, (80, 54, 32))
            s.box(x - 0.01, x + 0.06, 0, 0.08, z - 0.01, z + 0.06, (30, 26, 24))  # wheels
    s.box(cx0, cx1, 0.95, 1.0, cz0 - 0.15, cz0, (80, 54, 32))  # handle
    for y in (0.3, 0.8):
        z = cz0 + 0.04
        while z < cz1 - 0.08:
            w = rng.uniform(0.06, 0.12)
            h = rng.uniform(0.2, 0.32)
            col = rng.choice(SPINES)
            s.box(cx0 + 0.12, cx1 - 0.06, y, y + h, z, z + w, col, bias=0.5)
            z += w + 0.01
    # the hollow book lying flat on top of the returns, pale and conspicuous
    s.box(cx0 + 0.1, cx1 - 0.05, 0.8 + 0.34, 0.8 + 0.42, 2.0, 2.4, (176, 150, 96), bias=1)
    s.box(cx0 + 0.12, cx1 - 0.07, 0.8 + 0.42, 0.8 + 0.425, 2.02, 2.38, (200, 180, 120), bias=1.1)


ROOM = dict(a=[shell, library_a], c=[shell, library_c], light_a=(150, 90), light_c=(150, 110), light=rr.WARM)
