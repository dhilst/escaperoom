"""The Clock Tower: a stopped clock mechanism (camera A) and the back of the moonlit
clock face, a tool cupboard and the barred stair door (camera C)."""

import math
import random

import render_rooms as rr

R, HT = rr.ROOM, rr.HEIGHT
IRON = (96, 92, 88)
DARK_IRON = (58, 56, 54)
BRASS = (190, 150, 60)
WOOD = (74, 52, 36)


def gear(s, center, radius, teeth, color, wall="zR", inset=0.0, bias=0.0, hub=None):
    """A toothed wheel lying flat against a wall plane: rim polygon, darker hub."""
    cx, cy = center
    pts = []
    n = teeth * 4
    for i in range(n):
        a = 2 * math.pi * i / n
        r = radius if (i % 4) in (0, 1) else radius * 0.86
        u, v = cx + r * math.cos(a), cy + r * math.sin(a)
        pts.append(_on(wall, u, v, inset))
    s.quad(pts, color, bias=bias)
    inner = tuple(int(c * 0.55) for c in color)
    s.disc_on_wall(_on(wall, cx, cy, inset + 0.002), radius * 0.66, *_axes(wall), inner, 12, bias=bias + 0.1)
    w = radius * 0.09
    for i in range(3):  # flat spokes across the hub
        a = math.pi / 6 + i * math.pi / 3
        dx, dy = math.cos(a) * radius * 0.68, math.sin(a) * radius * 0.68
        nx, ny = -math.sin(a) * w, math.cos(a) * w
        s.quad([_on(wall, cx - dx - nx, cy - dy - ny, inset + 0.01), _on(wall, cx + dx - nx, cy + dy - ny, inset + 0.01),
                _on(wall, cx + dx + nx, cy + dy + ny, inset + 0.01), _on(wall, cx - dx + nx, cy - dy + ny, inset + 0.01)],
               color, bias=bias + 0.2)
    s.disc_on_wall(_on(wall, cx, cy, inset + 0.03), radius * 0.16, *_axes(wall), hub or DARK_IRON, 8, bias=bias + 0.3)


def _on(wall, u, v, inset):
    if wall == "zR":
        return (u, v, R - inset)
    if wall == "z0":
        return (u, v, inset)
    if wall == "xR":
        return (R - inset, v, u)
    return (inset, v, u)


def _axes(wall):
    return ((1, 0, 0), (0, 1, 0)) if wall in ("zR", "z0") else ((0, 0, 1), (0, 1, 0))


def shell(s):
    rr.walls_floor(s, (78, 58, 42), (40, 32, 26), (70, 54, 42), (88, 68, 52))
    rng = random.Random(17)
    for wall in ("z0", "zR", "x0", "xR"):  # vertical planks
        u = 0.0
        while u < R:
            rr.wall_quad(s, wall, u, u + 0.018, 0, HT, (38, 28, 22), inset=0.002, bias=-39)
            u += rng.uniform(0.2, 0.3)
    for k in range(1, 12):  # floorboards
        z = R * k / 12
        s.quad([(0, 0.001, z), (R, 0.001, z), (R, 0.001, z + 0.022), (0, 0.001, z + 0.022)], (46, 34, 26), bias=-45)
    for k in (1, 3):  # heavy roof beams
        x = R * k / 4
        s.box(x - 0.09, x + 0.09, HT - 0.2, HT, 0, R, (52, 38, 28), bias=-30)


def tower_a(s):
    """Clockwork frame against the z = R wall, pendulum below, nest on a beam along x = R."""
    # iron frame: two posts and two cross bars
    for x in (0.45, 3.45):
        s.box(x, x + 0.12, 0, 2.5, R - 0.75, R - 0.63, DARK_IRON)
    for y in (0.35, 2.4):
        s.box(0.45, 3.57, y, y + 0.1, R - 0.75, R - 0.63, DARK_IRON)
    # big wheels
    gear(s, (1.25, 1.5), 0.78, 18, IRON, inset=0.45, bias=1)
    gear(s, (2.4, 1.95), 0.44, 12, (128, 110, 84), inset=0.42, bias=1.5)
    gear(s, (2.35, 0.85), 0.4, 11, IRON, inset=0.4, bias=1.5)
    # the empty axle: a bright steel pin sticking out of a bare bracket, a pale ring where a wheel once sat
    ex, ey = 3.0, 1.45
    s.disc_on_wall((ex, ey, R - 0.36), 0.3, (1, 0, 0), (0, 1, 0), (66, 50, 40), 14, bias=1.8)
    s.disc_on_wall((ex, ey, R - 0.365), 0.24, (1, 0, 0), (0, 1, 0), (40, 32, 28), 14, bias=1.9)
    s.box(ex - 0.12, ex + 0.12, ey - 0.12, ey + 0.12, R - 0.4, R - 0.36, (60, 56, 52), bias=2)
    s.beam((ex, ey, R - 0.4), (ex, ey, R - 0.85), 0.08, (176, 166, 146), bias=3)
    s.disc_on_wall((ex, ey, R - 0.855), 0.05, (1, 0, 0), (0, 1, 0), (120, 70, 40), 6, bias=3.2)  # rust cap
    # pendulum: rod from the top bar, round bob, perfectly still
    px = 1.95
    s.beam((px, 2.4, R - 0.85), (px, 0.62, R - 0.85), 0.04, (140, 118, 74), bias=2.5)
    s.disc_on_wall((px, 0.5, R - 0.87), 0.2, (1, 0, 0), (0, 1, 0), (176, 140, 66), 12, bias=2.6)
    s.disc_on_wall((px - 0.05, 0.55, R - 0.875), 0.08, (1, 0, 0), (0, 1, 0), (214, 184, 104), 8, bias=2.7)
    # a beam along the x = R wall, with the nest on it
    s.box(R - 0.35, R, 1.75, 1.92, 0.8, R, (90, 64, 44), bias=1)
    nx, nz = R - 0.2, 2.4
    s.box(nx - 0.2, nx + 0.16, 1.92, 2.08, nz - 0.3, nz + 0.3, (100, 78, 50), bias=1.5)
    rng = random.Random(5)
    for _ in range(12):  # twigs
        a = (nx + rng.uniform(-0.22, 0.12), 1.95 + rng.uniform(0, 0.12), nz + rng.uniform(-0.34, 0.34))
        b = (a[0] + rng.uniform(-0.12, 0.12), a[1] + rng.uniform(0, 0.1), a[2] + rng.uniform(-0.2, 0.2))
        s.beam(a, b, 0.022, (128, 98, 62), bias=1.8)
    s.box(nx - 0.16, nx - 0.02, 2.04, 2.12, nz - 0.1, nz + 0.06, (250, 210, 90), bias=2.2)  # brass glint
    # moonlight through a louvre high on the x = R wall
    for i in range(4):
        rr.wall_quad(s, "xR", 1.0 + i * 0.14, 1.09 + i * 0.14, 2.15, 2.5, (130, 140, 170), inset=0.003, bias=-38)
    s.quad([(2.9, 0.003, 0.9), (3.9, 0.003, 0.9), (3.9, 0.003, 1.6), (2.6, 0.003, 1.6)], (84, 82, 96), bias=-44)


def tower_c(s):
    """Back of the clock face on z = 0, tool cupboard in the corner, barred door on x = 0."""
    fc = (2.55, 1.45)
    # moonlight pooled on the floor
    s.quad([(1.6, 0.003, 0.2), (3.5, 0.003, 0.2), (3.8, 0.003, 1.9), (1.3, 0.003, 1.9)], (82, 84, 102), bias=-44)
    # the great translucent face: dark ring, milky glass, mirrored numerals, hands
    s.disc_on_wall((fc[0], fc[1], 0.004), 1.12, (1, 0, 0), (0, 1, 0), (46, 38, 32), 20, bias=0.5)
    s.disc_on_wall((fc[0], fc[1], 0.006), 1.0, (1, 0, 0), (0, 1, 0), (150, 160, 184), 20, bias=1)
    for i in range(12):
        a = 2 * math.pi * i / 12
        x, y = fc[0] + 0.84 * math.cos(a), fc[1] + 0.84 * math.sin(a)
        rr.wall_quad(s, "z0", x - 0.03, x + 0.03, y - 0.07, y + 0.07, (60, 60, 80), inset=0.008, bias=1.5)
    s.beam((fc[0], fc[1], 0.02), (fc[0] - 0.45, fc[1] + 0.55, 0.02), 0.07, (34, 30, 30), bias=2)
    s.beam((fc[0], fc[1], 0.02), (fc[0] + 0.62, fc[1] - 0.2, 0.02), 0.05, (34, 30, 30), bias=2)
    s.disc_on_wall((fc[0], fc[1], 0.04), 0.09, (1, 0, 0), (0, 1, 0), (40, 34, 30), 8, bias=2.2)
    # tool cupboard in the corner, door ajar a crack
    s.box(0.2, 1.05, 0, 1.75, 0.02, 0.5, (92, 62, 40))
    rr.wall_quad(s, "z0", 0.26, 0.62, 0.1, 1.68, (110, 76, 48), inset=0.505, bias=1)
    rr.wall_quad(s, "z0", 0.64, 0.99, 0.1, 1.68, (104, 70, 44), inset=0.505, bias=1)
    for x in (0.55, 0.71):
        s.box(x, x + 0.03, 0.85, 1.0, 0.5, 0.54, (160, 140, 90), bias=1.5)  # handles
    s.box(0.2, 1.05, 1.75, 1.82, 0.0, 0.55, (70, 48, 32), bias=0.5)  # top board
    # stair door on the x = 0 wall
    rr.wall_quad(s, "x0", 1.45, 2.55, 0, 2.05, (40, 30, 24), inset=0.004, bias=0.5)
    rr.wall_quad(s, "x0", 1.52, 2.48, 0, 1.98, (104, 72, 46), inset=0.006, bias=1)
    for z in (1.75, 2.0, 2.25):
        rr.wall_quad(s, "x0", z, z + 0.02, 0, 1.98, (70, 48, 30), inset=0.008, bias=1.2)
    # iron rods across the door, bolted into a rod that climbs to the clockwork
    for y in (0.5, 1.05, 1.6):
        s.beam((0.12, y, 1.3), (0.12, y, 2.7), 0.07, (120, 120, 126), bias=2)
        s.box(0.0, 0.16, y - 0.07, y + 0.07, 2.62, 2.74, DARK_IRON, bias=2.1)
    s.beam((0.12, 0.4, 2.8), (0.12, HT, 2.8), 0.08, (110, 110, 116), bias=2)
    for y in (0.5, 1.05, 1.6):
        s.beam((0.12, y, 2.68), (0.12, y, 2.8), 0.06, (100, 100, 106), bias=2.2)
    s.beam((0.12, HT - 0.1, 2.8), (2.0, HT - 0.1, 3.9), 0.06, (90, 90, 96), bias=1)  # linkage to the mechanism


ROOM = dict(
    a=[shell, tower_a],
    c=[shell, tower_c],
    light_a=(200, 40),
    light_c=(120, 110),
    light=rr.MOON,
)
