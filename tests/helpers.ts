import roomJson from "../rooms/study/room.json";
import { buildAliasMap, createInitialState, parse, step, validateRoom } from "../src/engine";
import type { GameEvent, GameState } from "../src/engine";

export const room = validateRoom(roomJson);
export const aliases = buildAliasMap(room);

/** Run raw input lines from `start` and collect every event. Parse errors fail the test. */
export function play(lines: string[], start: GameState = createInitialState(room)) {
  let state = start;
  const log: GameEvent[][] = [];
  for (const line of lines) {
    const parsed = parse(line, aliases);
    if (!parsed.ok) throw new Error(`parse failed for "${line}": ${parsed.error}`);
    const result = step(state, parsed.command, room);
    state = result.state;
    log.push(result.events);
  }
  return { state, log, last: log[log.length - 1] ?? [] };
}

export const texts = (events: GameEvent[]) =>
  events.flatMap((e) => ("text" in e ? [e.text] : []));
