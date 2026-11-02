import { loadGame } from "../src/content";
import { buildAliasMap, createGameState, createInitialState, parse, step, stepGame } from "../src/engine";
import type { GameDefinition, GameEvent, GameState } from "../src/engine";
import { LANGUAGES, localize, type Locale } from "../src/i18n";
import rawStudy from "../rooms/study/room.json";

export const game = loadGame("en-US");
export const room = game.rooms.study;
export const aliases = buildAliasMap(room);
/** The study's room.json with English text, for building variants in tests. */
export const studyJson = localize(rawStudy, "en-US");

function parseOrThrow(line: string, roomId: string, g: GameDefinition = game, locale: Locale = "en-US") {
  const language = LANGUAGES[locale].parser;
  const parsed = parse(line, buildAliasMap(g.rooms[roomId], language), language);
  if (!parsed.ok) throw new Error(`parse failed for "${line}": ${parsed.error}`);
  return parsed.command;
}

/** Run raw input lines in the study only (single-room step). Parse errors fail the test. */
export function play(lines: string[], start: GameState = createInitialState(room)) {
  let state = start;
  const log: GameEvent[][] = [];
  for (const line of lines) {
    const result = step(state, parseOrThrow(line, room.id), room);
    state = result.state;
    log.push(result.events);
  }
  return { state, log, last: log[log.length - 1] ?? [] };
}

/** Run raw input lines through the whole game, following room changes, at host time `now` (ms). */
export function playGame(
  lines: string[],
  start: GameState = createGameState(game),
  locale: Locale = "en-US",
  now = 0,
) {
  const g = loadGame(locale);
  let state = start;
  const log: GameEvent[][] = [];
  for (const line of lines) {
    const result = stepGame(state, parseOrThrow(line, state.roomId, g, locale), g, LANGUAGES[locale].engine, now);
    state = result.state;
    log.push(result.events);
  }
  return { state, log, last: log[log.length - 1] ?? [] };
}

export const texts = (events: GameEvent[]) =>
  events.flatMap((e) => ("text" in e ? [e.text] : []));

export const STUDY_SOLUTION = ["use 0315 drawer", "turn", "use key door"];
export const CELLAR_SOLUTION = [
  "open toolbox",
  "turn",
  "use crowbar crate",
  "turn",
  "use fuse fuse box",
  "turn",
  "use 7419 door",
];
export const OBSERVATORY_SOLUTION = [
  "open birdcage",
  "turn",
  "use crank music box",
  "turn",
  "use lens telescope",
  "turn",
  "use 2618 hatch",
];
