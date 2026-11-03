import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const music = game.rooms.musicroom;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.musicroom);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);
const LATER = 7 * 60 * 60_000;

/** Curtains open, the key fitted, standing at the piano (camera A). */
const READY = ["open curtains", "turn", "open cello case", "bow gramophone", "turn", "ivory key piano"];

describe("The Music Room", () => {
  it("is solved by its solution and leads to the billiard room", () => {
    const { state, last } = run(solution("musicroom"));
    expect(texts(last)[0]).toMatch(/room of green baize/);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "billiards" }));
    expect(state).toMatchObject({ roomId: "billiards", inventory: [] });
  });

  it("the sheet music can only be read once the curtains are open, and is noted once", () => {
    expect(texts(run(["sheet music"]).last)[0]).toMatch(/Too dark/);
    expect(run(["sheet music"]).state.inventory).toEqual([]);
    const { state, log } = run(["open curtains", "sheet music", "score", "inventory"]);
    expect(texts(log[1])).toEqual([
      "A lullaby, copied by hand. Under the staff someone pencilled the names:\nRE, LA, MI, SOL. In the margin: \"She always played it backwards.\"",
      "[Lullaby: re la mi sol, backwards added to inventory]",
    ]);
    expect(texts(log[2])).toHaveLength(1);
    expect(texts(log[3])).toEqual(["- Lullaby: re la mi sol, backwards"]);
    expect(state.inventory).toEqual(["sheet_note"]);
  });

  it("the bow comes from the case, once, and frees the key from the horn", () => {
    const { state, log } = run(["turn", "open cello case", "open case", "gramophone", "bow gramophone", "gramophone"]);
    expect(texts(log[1])).toContain("[Cello bow added to inventory]");
    expect(texts(log[2])).toEqual(["Only faded velvet left inside."]);
    expect(texts(log[3])[0]).toMatch(/Something pale is wedged deep/);
    expect(texts(log[4])).toEqual([
      "You slide the bow deep into the horn and work the thing loose.\nIt drops into your palm. You found an ivory piano key!",
      "[Cello bow removed from inventory]",
      "[Ivory key added to inventory]",
    ]);
    expect(texts(log[5])[0]).toMatch(/empty now/);
    expect(state.inventory).toEqual(["ivory_key"]);
  });

  it("the missing key leaves a gap, until it is fitted", () => {
    expect(texts(run(["la piano"]).last)).toEqual(["Your finger finds only the gap where the la key should be."]);
    expect(texts(run(["mi piano"]).last)).toEqual(["Mi. The note rings out and slowly fades."]);
    const { state, last } = run([...READY, "la piano"]);
    expect(texts(last)).toEqual(["La. The note rings out and slowly fades."]);
    expect(state.flags.key_fitted).toBe(true);
    expect(state.inventory).toEqual([]);
    expect(texts(run(["ti piano"]).last)).toEqual(["Si. The note rings out and slowly fades."]);
  });

  it("the tune played backwards opens the lyre panel", () => {
    const { state, last } = run([...READY, "sol mi la re piano"]);
    expect(texts(last)[0]).toMatch(/^Sol, mi, la, re\..*the lyre panel swings open\.$/s);
    expect(state.flags.panel_open).toBe(true);
    expect(texts(run(["sol mi la re piano"], state).last)).toEqual(["The panel already stands open behind you."]);
  });

  it("forwards, a wrong or partial tune, or a missing key does nothing", () => {
    for (const line of ["re la mi sol piano", "sol mi re la piano", "mi la re piano", "sol mi la re", "sol mi la re do piano"]) {
      const { state, last } = run([...READY, line]);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.flags.panel_open, line).toBe(false);
    }
    expect(texts(run(["sol mi la re piano"]).last)).toEqual(["Nothing happens."]); // the gap
  });

  it("the panel is a dead end until the tune is played", () => {
    const { state, last } = run(["turn", "open panel"]);
    expect(texts(last)[0]).toMatch(/won't budge/);
    expect(state.roomId).toBe("musicroom");
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["gramophone"]).last)).toEqual(["You don't see any gramophone here."]);
    expect(texts(run(["turn", "piano"]).last)).toEqual(["You don't see any piano here."]);
    expect(texts(run(["turn", "sol mi la re piano"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const { log } = run(["piano", "curtains", "candelabra", "bench", "open bench", "turn", "cello", "cello case", "panel"]);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("is dark until the curtains open on the moonlight", () => {
    expect(roomBrightness(start(), music)).toBe(0.45);
    expect(roomBrightness(run(["open curtains"]).state, music)).toBe(1.05);
    expect(describeCamera(start(), music, "A")).toMatch(/waits in the gloom/);
    expect(describeCamera(run(["open curtains"]).state, music, "A")).toMatch(/^Moonlight falls/);
    const open = run([...READY, "sol mi la re piano"]).state;
    expect(describeCamera(open, music, "C")).toMatch(/lyre panel stands open/);
  });

  it("skips the hints about steps already done", () => {
    const { state, last } = playGame(["open curtains", "sheet music", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([2]);
    expect(texts(last)).toEqual([`Hint 3/5: ${music.hints![2].text}`]);
  });

  it("is translated", () => {
    const pt = run(["abrir cortinas", "partitura"], start("pt-BR"), "pt-BR");
    expect(texts(pt.last)[1]).toBe("[Adicionado ao inventário: Canção: re la mi sol, de trás para a frente]");
    const ptWin = run(solution("musicroom", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(texts(ptWin.last)[0]).toMatch(/sala de feltro verde/);
    const es = run(["girar", "abrir estuche", "arco gramófono"], start("es"), "es");
    expect(texts(es.last)[0]).toMatch(/¡Encontraste una tecla de marfil!$/);
    const esWin = run(solution("musicroom", "es"), start("es"), "es");
    expect(esWin.state.roomId).toBe("billiards");
  });
});
