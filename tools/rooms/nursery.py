"""The Nursery: toy shelf with picture blocks, rocking horse and crib (camera A);
a faded sky mural, a mobile and a small locked door (camera C)."""

import math
import random

import render_rooms as rr

R, HGT = rr.ROOM, rr.HEIGHT


def shell(s):
    rr.walls_floor(s, (88, 66, 48), (46, 44, 48), (76, 82, 88), (90, 96, 100))
    rng = random.Random(15)
    # striped wallpaper above a dado rail, peeling in places
    for wall in ("z0", "zR", "x0", "xR"):
        u = 0.0
        while u < R:
            rr.wall_quad(s, wall, u, u + 0.12, 0.95, HGT, (100, 82, 90), inset=0.002, bias=-39)
            u += 0.3
        rr.wall_quad(s, wall, 0, R, 0.9, 0.97, (130, 120, 104), inset=0.003, bias=-38)  # dado rail
        rr.wall_quad(s, wall, 0, R, 0, 0.9, (78, 70, 64), inset=0.002, bias=-39)  # wainscot
        for _ in range(3):
            u0, y0 = rng.uniform(0.2, R - 0.6), rng.uniform(1.4, 2.3)
            rr.wall_quad(s, wall, u0, u0 + rng.uniform(0.15, 0.35), y0, y0 + rng.uniform(0.2, 0.4),
                         (66, 62, 56), inset=0.004, bias=-37)
    for k in range(1, 14):  # floorboards
        z = R * k / 14
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.02), (0, 0.001, z + 0.02)], (60, 44, 32), bias=-45)
    # a round rag rug in the middle
    s.disc_on_wall((2.0, 0.003, 2.0), 0.8, (1, 0, 0), (0, 0, 1), (104, 64, 60), 12, bias=-44)
    s.disc_on_wall((2.0, 0.004, 2.0), 0.55, (1, 0, 0), (0, 0, 1), (84, 90, 104), 12, bias=-43)


def star_pts(cx, cy, r_out, r_in, n=5):
    pts = []
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = math.pi / 2 + math.pi * i / n
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def wall_poly(s, wall, pts2d, inset, color, bias):
    """A flat 2D polygon (u, y) on a wall; star shapes need a fan, so draw triangles from the centre."""
    def p(u, y):
        if wall == "zR":
            return (u, y, R - inset)
        if wall == "z0":
            return (u, y, inset)
        if wall == "xR":
            return (R - inset, y, u)
        return (inset, y, u)
    cu = sum(q[0] for q in pts2d) / len(pts2d)
    cy = sum(q[1] for q in pts2d) / len(pts2d)
    for i, a in enumerate(pts2d):
        b = pts2d[(i + 1) % len(pts2d)]
        s.quad([p(cu, cy), p(*a), p(*b)], color, bias=bias)


def nursery_a(s):
    """Toy shelf + blocks on the z = ROOM wall, rocking horse in front, crib on x = ROOM."""
    # toy shelf
    wood = (150, 120, 96)
    s.box(0.7, 2.1, 0, 1.0, R - 0.4, R, wood)
    zf = R - 0.4
    for y0 in (0.08, 0.52):
        rr.wall_quad(s, "zR", 0.76, 2.04, y0, y0 + 0.38, (40, 32, 28), inset=0.401, bias=0.5)
    # broken toys on the lower shelves
    s.box(0.85, 1.15, 0.08, 0.3, zf + 0.05, zf + 0.3, (120, 50, 44), bias=0.6)   # drum
    s.box(1.3, 1.5, 0.08, 0.4, zf + 0.08, zf + 0.3, (170, 150, 120), bias=0.6)  # doll body
    s.box(1.33, 1.47, 0.4, 0.52, zf + 0.12, zf + 0.26, (190, 170, 150), bias=0.7)  # doll head
    s.box(1.65, 1.95, 0.52, 0.66, zf + 0.06, zf + 0.3, (70, 90, 110), bias=0.6)  # toy cart
    s.box(0.85, 1.25, 0.52, 0.62, zf + 0.06, zf + 0.3, (110, 100, 60), bias=0.6)  # picture book
    # three big picture blocks on top: star, sun, moon (left to right)
    bs = 0.26
    blocks = [((0.85, 1.0), (196, 172, 90)), ((1.27, 1.0), (190, 110, 70)), ((1.69, 1.0), (110, 130, 176))]
    for (x0, y0), col in blocks:
        s.box(x0, x0 + bs, y0, y0 + bs, zf + 0.06, zf + 0.06 + bs, col, bias=0.8)
    fz = zf + 0.06 - 0.003  # front faces of the blocks (towards the camera)
    def front(x0, pts, color):
        def p(u, y):
            return (x0 + u, 1.0 + y, fz)
        cu = sum(q[0] for q in pts) / len(pts)
        cy = sum(q[1] for q in pts) / len(pts)
        for i, a in enumerate(pts):
            b = pts[(i + 1) % len(pts)]
            s.quad([p(cu, cy), p(*a), p(*b)], color, bias=1.5)
    front(0.85, star_pts(0.13, 0.13, 0.11, 0.045), (250, 236, 150))       # star
    front(1.27, [(0.13 + 0.08 * math.cos(a), 0.13 + 0.08 * math.sin(a))
                 for a in (2 * math.pi * i / 10 for i in range(10))], (250, 200, 70))  # sun
    for i in range(8):  # sun rays
        a = 2 * math.pi * i / 8
        cx, cy = 1.27 + 0.13, 1.13
        s.beam((cx + 0.09 * math.cos(a), cy + 0.09 * math.sin(a), fz - 0.002),
               (cx + 0.12 * math.cos(a), cy + 0.12 * math.sin(a), fz - 0.002), 0.018, (250, 200, 70), bias=1.4)
    moon = [(0.13 + 0.1 * math.cos(a), 0.13 + 0.1 * math.sin(a)) for a in (2 * math.pi * i / 12 for i in range(12))]
    front(1.69, moon, (236, 232, 200))
    front(1.69, [(0.17 + 0.08 * math.cos(a), 0.15 + 0.08 * math.sin(a))
                 for a in (2 * math.pi * i / 12 for i in range(12))], (110, 130, 176))  # bite -> crescent
    # small painted digits as dark marks under each picture
    for x0 in (0.85, 1.27, 1.69):
        s.quad([(x0 + 0.11, 1.015, fz - 0.004), (x0 + 0.15, 1.015, fz - 0.004),
                (x0 + 0.15, 1.035, fz - 0.004), (x0 + 0.11, 1.035, fz - 0.004)], (40, 30, 26), bias=1.6)

    # rocking horse on the floor, side-on, facing right
    hx, hz = 2.75, 3.1
    body = (176, 150, 120)
    for dz in (-0.12, 0.12):
        s.beam((hx - 0.5, 0.12, hz + dz), (hx - 0.15, 0.02, hz + dz), 0.05, (120, 60, 44), bias=0.2)
        s.beam((hx - 0.15, 0.02, hz + dz), (hx + 0.2, 0.02, hz + dz), 0.05, (120, 60, 44), bias=0.2)
        s.beam((hx + 0.2, 0.02, hz + dz), (hx + 0.5, 0.12, hz + dz), 0.05, (120, 60, 44), bias=0.2)
        for lx in (-0.3, 0.3):
            s.beam((hx + lx * 0.9, 0.06, hz + dz), (hx + lx * 0.6, 0.45, hz + dz), 0.05, body, bias=0.3)
    s.box(hx - 0.32, hx + 0.32, 0.42, 0.66, hz - 0.13, hz + 0.13, body, bias=0.4)
    s.beam((hx + 0.25, 0.6, hz), (hx + 0.42, 0.92, hz), 0.12, body, bias=0.5)          # neck
    s.box(hx + 0.36, hx + 0.62, 0.84, 1.0, hz - 0.07, hz + 0.07, body, bias=0.6)        # head
    s.beam((hx + 0.22, 0.7, hz), (hx + 0.36, 1.02, hz), 0.06, (70, 40, 30), bias=0.7)   # mane
    s.beam((hx - 0.32, 0.6, hz), (hx - 0.48, 0.32, hz), 0.06, (70, 40, 30), bias=0.5)   # tail
    s.box(hx - 0.12, hx + 0.12, 0.66, 0.7, hz - 0.14, hz + 0.14, (140, 40, 40), bias=0.6)  # saddle

    # crib against the x = ROOM wall
    c0, c1, x0, x1 = 1.5, 2.9, R - 0.75, R - 0.05
    white = (176, 172, 160)
    s.box(x0, x1, 0.35, 0.42, c0, c1, (120, 116, 108))                           # base
    for (cx, cz) in ((x0, c0), (x0, c1), (x1, c0), (x1, c1)):
        s.beam((cx, 0, cz), (cx, 1.0, cz), 0.06, white, bias=0.3)
    for y in (0.42, 0.95):
        s.beam((x0, y, c0), (x0, y, c1), 0.05, white, bias=0.35)
        s.beam((x0, y, c0), (x1, y, c0), 0.05, white, bias=0.35)
        s.beam((x0, y, c1), (x1, y, c1), 0.05, white, bias=0.35)
    k = 1
    while c0 + k * 0.12 < c1 - 0.05:
        s.beam((x0, 0.42, c0 + k * 0.12), (x0, 0.95, c0 + k * 0.12), 0.025, white, bias=0.4)
        k += 1
    for k in range(1, 6):
        xx = x0 + (x1 - x0) * k / 6
        s.beam((xx, 0.42, c0), (xx, 0.95, c0), 0.025, white, bias=0.4)
    # rattle lying inside
    s.box(x0 + 0.25, x0 + 0.37, 0.42, 0.54, 2.1, 2.22, (190, 170, 90), bias=0.6)
    s.beam((x0 + 0.31, 0.46, 2.22), (x0 + 0.31, 0.46, 2.42), 0.03, (190, 170, 90), bias=0.6)


def nursery_c(s):
    """Sky mural on the z = 0 wall (sun, moon, star read left to right), mobile, small door on x = 0."""
    # mural: higher x is further left from this camera
    rr.wall_quad(s, "z0", 0.7, 3.6, 1.0, 2.35, (40, 48, 70), inset=0.005, bias=0.5)
    rr.wall_quad(s, "z0", 0.7, 3.6, 1.0, 1.3, (70, 70, 84), inset=0.006, bias=0.6)   # faded hills
    rr.wall_quad(s, "z0", 2.2, 3.6, 1.3, 2.35, (88, 70, 66), inset=0.006, bias=0.6)  # dusk side
    rng = random.Random(6)
    for _ in range(5):  # flaking paint
        u0, y0 = rng.uniform(0.8, 3.3), rng.uniform(1.05, 1.3)
        rr.wall_quad(s, "z0", u0, u0 + rng.uniform(0.1, 0.25), y0, y0 + rng.uniform(0.08, 0.2),
                     (96, 100, 104), inset=0.007, bias=0.7)
    # sun (left)
    sun = (3.05, 1.75)
    s.disc_on_wall((sun[0], sun[1], 0.009), 0.24, (-1, 0, 0), (0, 1, 0), (220, 150, 60), 12, bias=1)
    for i in range(10):
        a = 2 * math.pi * i / 10
        s.beam((sun[0] + 0.28 * math.cos(a), sun[1] + 0.28 * math.sin(a), 0.012),
               (sun[0] + 0.4 * math.cos(a), sun[1] + 0.4 * math.sin(a), 0.012), 0.04, (210, 140, 60), bias=1.1)
    # moon (middle): pale disc with a sky-coloured bite
    moon = (2.05, 1.8)
    s.disc_on_wall((moon[0], moon[1], 0.009), 0.24, (-1, 0, 0), (0, 1, 0), (220, 216, 180), 12, bias=1)
    s.disc_on_wall((moon[0] - 0.11, moon[1] + 0.06, 0.011), 0.21, (-1, 0, 0), (0, 1, 0), (40, 48, 70), 12, bias=1.2)
    # star (right)
    wall_poly(s, "z0", star_pts(1.2, 1.8, 0.26, 0.1), 0.009, (236, 222, 130), 1)
    # small dots of painted stars around it
    for _ in range(7):
        u, y = rng.uniform(0.8, 1.7), rng.uniform(1.35, 2.25)
        s.disc_on_wall((u, y, 0.01), 0.02, (1, 0, 0), (0, 1, 0), (170, 170, 150), 4, bias=0.9)

    # mobile hanging from the ceiling: crossed sticks with paper birds
    mx, mz, my = 1.7, 1.9, 1.9
    s.beam((mx, HGT, mz), (mx, my, mz), 0.012, (40, 36, 30))
    s.beam((mx - 0.45, my, mz), (mx + 0.45, my, mz), 0.025, (120, 90, 60), bias=0.2)
    s.beam((mx, my, mz - 0.45), (mx, my, mz + 0.45), 0.025, (120, 90, 60), bias=0.2)
    for (bx, bz) in ((mx - 0.43, mz), (mx + 0.43, mz), (mx, mz - 0.43), (mx, mz + 0.43)):
        by = my - 0.28
        s.beam((bx, my, bz), (bx, by + 0.05, bz), 0.008, (60, 56, 50))
        # flat paper birds turned towards the camera: wings spread along (1, 0, -1)
        ux, uz = 0.707, -0.707
        def w(du, dy):
            return (bx + ux * du, by + dy, bz + uz * du)
        s.quad([w(-0.17, 0.1), w(-0.05, 0.0), w(0, -0.03), w(0.05, 0.0), w(0.17, 0.1), w(0, 0.04)],
               (214, 204, 184), bias=0.5)
        s.quad([w(-0.03, -0.01), w(0.03, -0.01), w(0, -0.1)], (170, 160, 140), bias=0.6)  # tail

    # small white door on the x = 0 wall
    rr.wall_quad(s, "x0", 1.45, 2.4, 0, 1.6, (70, 62, 54), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.52, 2.33, 0, 1.53, (176, 170, 156), inset=0.006, bias=1)
    for (y0, y1) in ((0.15, 0.7), (0.85, 1.4)):
        rr.wall_quad(s, "x0", 1.62, 2.23, y0, y1, (150, 144, 132), inset=0.008, bias=1.5)
    # brass lock with three dials
    s.box(0.006, 0.07, 0.7, 0.98, 2.04, 2.28, (190, 150, 60), bias=2)
    for i in range(3):
        z = 2.08 + i * 0.08
        s.box(0.07, 0.11, 0.76, 0.92, z - 0.028, z + 0.028, (70, 50, 26), bias=2.2)
    # light leaking under the door
    s.quad([(0.006, 0.002, 1.52), (0.006, 0.002, 2.33), (0.2, 0.002, 2.25), (0.2, 0.002, 1.6)], (120, 116, 100), bias=-42)


ROOM = dict(a=[shell, nursery_a], c=[shell, nursery_c], light_a=(110, 120), light_c=(150, 110), light=rr.WARM)
