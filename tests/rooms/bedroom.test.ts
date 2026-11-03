import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const bedroom = game.rooms.bedroom;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.bedroom);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);
const LATER = 7 * 60 * 60_000;

/** Lamp lit and the diary read, standing at the bed (camera A). */
const LIT = ["turn", "open vanity", "turn", "matchbook lamp", "diary"];
/** The wardrobe open, standing at it (camera C). */
const OPEN = [...LIT, "turn", "1106 jewelry box", "open locket", "tiny key wardrobe"];

describe("The Master Bedroom", () => {
  it("is solved by its solution and leads to the bathroom", () => {
    const { state, last } = run(solution("bedroom"));
    expect(texts(last)[0]).toMatch(/^You press the ivy, the rose, the lily\./);
    expect(texts(last)[0]).toContain("clawfoot tub");
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "bathroom" }));
    expect(state).toMatchObject({ roomId: "bathroom", inventory: [] });
  });

  it("the vanity gives the matchbook only once", () => {
    const { state, last } = run(["turn", "open vanity", "open vanity", "vanity"]);
    expect(state.inventory).toEqual(["matchbook"]);
    expect(texts(last)).toEqual(["Face powder and an old comb. The drawer hangs open."]);
  });

  it("the diary can't be read in the dark, and notes nothing", () => {
    const { state, log } = run(["pillow", "diary"]);
    expect(texts(log[0])[0]).toMatch(/small leather diary/);
    expect(texts(log[1])).toEqual(["A small leather diary. In this dark, the faded ink is unreadable."]);
    expect(state.inventory).toEqual([]);
  });

  it("the lamp lights the room and the diary's date is noted, once", () => {
    const { state, log } = run([...LIT, "diary", "inventory"]);
    expect(texts(log[3])[0]).toMatch(/warm light spreads/);
    expect(texts(log[3])).toContain("[Matchbook removed from inventory]");
    expect(texts(log[4])).toEqual([
      "You leaf to a page marked with a ribbon:\n\"The eleventh of June, the day we wed. He gave me a silver box for my jewels, and it keeps that day.\"",
      "[Diary: wed on 11 June added to inventory]",
    ]);
    expect(texts(log[5])).toHaveLength(1);
    expect(texts(log[6])).toEqual(["- Diary: wed on 11 June"]);
    expect(state.inventory).toEqual(["diary_note"]);
  });

  it("is dim until the lamp burns", () => {
    expect(roomBrightness(start(), bedroom)).toBe(0.45);
    expect(roomBrightness(run(LIT.slice(0, 3)).state, bedroom)).toBe(0.45);
    expect(roomBrightness(run(LIT).state, bedroom)).toBe(1.1);
    expect(describeCamera(run(LIT).state, bedroom, "A")).toMatch(/oil lamp burns low/);
  });

  it("the jewelry box shows its dials and wants the date as day and month", () => {
    const { state, log } = run(["turn", "jewelry box", "open box", "0611 box", "1106 box", "1106 box"]);
    expect(texts(log[1])[0]).toMatch(/four small number dials\.\nEngraved beneath them: DAY · MONTH\./);
    expect(texts(log[2])).toEqual(["It won't open. The four dials hold it shut."]);
    expect(texts(log[3])).toEqual(["Nothing happens."]);
    expect(texts(log[4])).toContain("[Locket added to inventory]");
    expect(texts(log[5])).toEqual(["Nothing happens."]);
    expect(state.inventory).toEqual(["locket"]);
  });

  it("the locket holds the tiny key and the inscription", () => {
    const { state, last } = run(["turn", "1106 box", "open locket", "open locket"]);
    expect(state.inventory).toEqual(["locket_note", "tiny_key"]);
    expect(texts(run(["turn", "1106 box", "open locket"]).last)).toEqual([
      "The locket opens. Inside are three pressed flowers and a few engraved words:\n\"A rose for the day we wed. Ivy for the day we met. A lily for the day you left me.\"\nA tiny key drops into your palm!",
      "[Locket removed from inventory]",
      "[Locket inscription added to inventory]",
      "[Tiny key added to inventory]",
    ]);
    expect(texts(last)).toEqual(["Nothing happens."]); // the locket is spent
  });

  it("the wardrobe is locked until the tiny key opens it, and shows the carvings", () => {
    expect(texts(run(["turn", "open wardrobe"]).last)[0]).toMatch(/^Locked\./);
    expect(texts(run(["turn", "carvings"]).last)[0]).toMatch(/wardrobe is shut/);
    const { state, last } = run(OPEN);
    expect(texts(last)[0]).toMatch(/TELL OUR STORY FROM THE BEGINNING/);
    expect(texts(last)).toContain("[Tiny key removed from inventory]");
    expect(state.flags.wardrobe_open).toBe(true);
    expect(describeCamera(state, bedroom, "C")).toMatch(/stands open/);
    expect(texts(run(["carvings"], state).last)[0]).toMatch(/a rose, a lily and an ivy leaf/);
  });

  it("the flowers must be pressed in the story's order, all at once", () => {
    const opened = run(OPEN).state;
    for (const line of [
      "rose ivy lily wardrobe",
      "rose lily ivy wardrobe",
      "lily rose ivy wardrobe",
      "ivy rose wardrobe",
      "ivy rose lily",
      "ivy wardrobe",
      "ivy",
    ]) {
      const { state, last } = run([line], opened);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.roomId, line).toBe("bedroom");
    }
    expect(run(["ivy rose lily carvings"], opened).state.roomId).toBe("bathroom");
  });

  it("the flowers do nothing while the wardrobe is shut", () => {
    const { state, last } = run(["turn", "ivy rose lily wardrobe"]);
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("bedroom");
  });

  it("objects belong to their camera", () => {
    expect(texts(run(["wardrobe"]).last)).toEqual(["You don't see any wardrobe here."]);
    expect(texts(run(["turn", "lamp"]).last)).toEqual(["You don't see any lamp here."]);
    expect(texts(run(["turn", "open vanity", "matchbook lamp"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const lines = ["bed", "pillow", "nightstand", "open nightstand", "lamp", "window", "turn", "mirror", "door", "open door"];
    for (const events of run(lines).log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("skips the hints about steps already done", () => {
    const { state, last } = run([...LIT, "hint"], start(), "en-US");
    expect(texts(last)[0]).toMatch(/^Next hint available in/);
    const later = playGame([...LIT, "hint"], start(), "en-US", LATER);
    expect(later.state.hints).toEqual([2]);
    expect(texts(later.last)).toEqual([`Hint 3/5: ${bedroom.hints![2].text}`]);
    expect(state.hints).toEqual([]);
  });

  it("is translated", () => {
    const pt = playGame(solution("bedroom", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(texts(pt.log[5])).toContain("[Adicionado ao inventário: Diário: casamento em 11 de junho]");
    expect(texts(pt.last)[0]).toMatch(/^Você aperta a hera, a rosa, o lírio\./);
    expect(pt.state.roomId).toBe("bathroom");

    const es = playGame(["girar", "joyero"], start("es"), "es");
    expect(texts(es.last)).toEqual([
      "Un joyero de plata con cuatro pequeños diales numerados.\nGrabado debajo: DÍA · MES.",
    ]);
    const esWin = playGame(solution("bedroom", "es"), start("es"), "es");
    expect(texts(esWin.last)[0]).toMatch(/^Presionas la hiedra, la rosa, el lirio\./);
  });
});
