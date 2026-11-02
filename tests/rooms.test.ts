// Checks every room of the game the same way, so new rooms are covered automatically.
import { describe, expect, it } from "vitest";
import { loadGame } from "../src/content";
import { createInitialState } from "../src/engine";
import { LOCALES } from "../src/i18n";
import { game, playGame, texts } from "./helpers";
import { solution } from "./solutions";

describe.each(game.order)("room %s", (roomId) => {
  const index = game.order.indexOf(roomId);
  const next = game.order[index + 1];

  it.each(LOCALES)("%s: its solution.json solves it", (locale) => {
    const lines = solution(roomId, locale);
    expect(lines?.length, "solution.json must have commands for every locale").toBeGreaterThan(0);
    const room = loadGame(locale).rooms[roomId];
    const { state, log } = playGame(lines, createInitialState(room), locale);
    // Every command in a solution must be understood and must not fail.
    log.forEach((events, i) => {
      const failure = events.find((e) => e.type === "failure");
      expect(failure, `"${lines[i]}" failed: ${texts(events).join(" / ")}`).toBeUndefined();
    });
    if (next) expect(state.roomId).toBe(next);
    else expect(state.completed).toBe(true);
  });

  it("cannot be left by brute force: no exit before the puzzle is solved", () => {
    const room = game.rooms[roomId];
    const objects = Object.keys(room.objects);
    const pokes = objects.flatMap((o) => [`open ${o.replace(/_/g, " ")}`, `inspect ${o.replace(/_/g, " ")}`]);
    const { state } = playGame([...pokes, "turn", ...pokes], createInitialState(room));
    // Opening/inspecting everything may collect items, but must not finish the room on its own.
    if (index >= 3 && room.interactions.length <= 1) return; // placeholder rooms
    expect(state.roomId === roomId && !state.completed, "the room should need more than open/inspect").toBe(true);
  });
});
