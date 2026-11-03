import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import type { GameState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const attic = game.rooms.attic;
const start = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.attic);
const run = (lines: string[], from: GameState = start(), locale: Locale = "en-US") => playGame(lines, from, locale);
const LATER = 7 * 60 * 60_000;

const SLIDES = ["ship_slide", "storm_slide", "island_slide", "lighthouse_slide"];
/** Slides in hand and the lantern lit, facing the sheet (camera C). */
const READY = ["open dress form", "turn", "open slide box", "matchbook lantern"];
const SHOW = "ship storm island lighthouse lantern";

describe("The Attic", () => {
  it("comes right before the foyer", () => {
    expect(game.order.indexOf("attic")).toBe(game.order.indexOf("foyer") - 1);
  });

  it("is solved by its solution and leads down to the foyer", () => {
    const { state, last } = run(solution("attic"));
    expect(texts(last)[0]).toMatch(/back stair corkscrews down.*grand foyer: a coat rack, a silent grandfather clock/s);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "foyer" }));
    expect(state).toMatchObject({ roomId: "foyer", inventory: [], completed: false });
  });

  it("the trunk holds the playbill, noted once", () => {
    const { state, log } = run(["trunk", "open trunk", "trunk", "open trunk", "inventory"]);
    expect(texts(log[0])[0]).toMatch(/not locked/);
    expect(texts(log[1])[0]).toMatch(/Setting sail\. The tempest\. Shipwrecked\. A light in the dark\./);
    expect(texts(log[1])).toContain("[Playbill: sail, tempest, shipwreck, a light added to inventory]");
    expect(texts(log[2])).toHaveLength(1);
    expect(texts(log[3])).toEqual(["Only costumes and cardboard props remain."]);
    expect(texts(log[4])).toEqual(["- Playbill: sail, tempest, shipwreck, a light"]);
    expect(state.inventory).toEqual(["playbill_note"]);
    expect(texts(run(["open trunk", "playbill"]).last)[0]).toMatch(/^THE LONG VOYAGE HOME/);
  });

  it("the gown's pocket and the slide box each give their reward once", () => {
    const { state, log } = run(["dress form", "open dress form", "open dress form", "turn", "open slide box", "open box", "box"]);
    expect(texts(log[0])[0]).toMatch(/rattles in the gown's pocket/);
    expect(texts(log[1])).toContain("[Matchbook added to inventory]");
    expect(texts(log[2])).toEqual(["The pocket is empty."]);
    expect(texts(log[4])).toHaveLength(5); // the message and four slides
    expect(texts(log[5])).toEqual(["Only empty felt slots."]);
    expect(state.inventory).toEqual(["matchbook", ...SLIDES]);
  });

  it("the matchbook lights the lantern, and the attic with it", () => {
    const { state, last } = run(READY);
    expect(texts(last)[0]).toMatch(/cone of warm light/);
    expect(texts(last)).toContain("[Matchbook removed from inventory]");
    expect(state.flags.lantern_lit).toBe(true);
    expect(roomBrightness(start(), attic)).toBe(0.45);
    expect(roomBrightness(state, attic)).toBe(1.1);
  });

  it("the whole show, in the playbill's order, opens the low door", () => {
    const { state, last } = run([...READY, SHOW]);
    expect(texts(last)[0]).toMatch(/^You feed the slides through the lantern.*The low door swings open\.$/s);
    expect(state.flags.show_done).toBe(true);
    expect(texts(run(["door"], state).last)[0]).toMatch(/stands open/);
    expect(texts(run([SHOW], state).last)).toEqual(["The show is over. The low door already stands open."]);
    // the full names work too
    const full = run([...READY, "ship slide storm slide island slide lighthouse slide magic lantern"]);
    expect(full.state.flags.show_done).toBe(true);
  });

  it("any other order, a missing slide, or a dark lantern does nothing", () => {
    for (const line of [
      "storm ship island lighthouse lantern",
      "ship island storm lighthouse lantern",
      "lighthouse island storm ship lantern",
      "ship storm island lantern",
      "ship storm island lighthouse",
      "ship storm island lighthouse sheet",
    ]) {
      const { state, last } = run([...READY, line]);
      expect(texts(last), line).toEqual(["Nothing happens."]);
      expect(state.flags.show_done, line).toBe(false);
    }
    const dark = run(["turn", "open slide box", SHOW]);
    expect(texts(dark.last)).toEqual(["Nothing happens."]);
    expect(texts(run(["turn", SHOW]).last)).toEqual(["Nothing happens."]); // no slides yet
  });

  it("one slide alone tells no story", () => {
    expect(texts(run(["turn", "open slide box", "ship lantern"]).last)).toEqual([
      "The lantern is dark. The slide would show nothing.",
    ]);
    const { state, last } = run([...READY, "lighthouse lantern"]);
    expect(texts(last)).toEqual([
      "The picture wavers on the sheet, then fades. One scene alone tells no story.\nThe lantern wants the whole show, in the playbill's order.",
    ]);
    expect(state.flags.show_done).toBe(false);
  });

  it("the low door won't open until the show is over", () => {
    const { state, last } = run(["turn", "open door"]);
    expect(texts(last)).toEqual(["Your fingers find no edge to pull. It won't budge."]);
    expect(state.roomId).toBe("attic");
  });

  it("splits the room across the cameras", () => {
    expect(texts(run(["lantern"]).last)).toEqual(["You don't see any lantern here."]);
    expect(texts(run(["turn", "trunk"]).last)).toEqual(["You don't see any trunk here."]);
    expect(texts(run(["open dress form", "matchbook lantern"]).last)).toEqual(["Nothing happens."]);
  });

  it("has a decorative line for every object in the room", () => {
    const { log } = run(["rocking chair", "round window", "open window", "rafters", "turn", "sheet", "lantern", "open lantern", "door", "rafters"]);
    for (const events of log) expect(events.find((e) => e.type === "failure")).toBeUndefined();
  });

  it("descriptions follow the light and the open door", () => {
    const lit = run(READY).state;
    const done = run([SHOW], lit).state;
    expect(describeCamera(start(), attic, "A")).toMatch(/^Moonlight/);
    expect(describeCamera(lit, attic, "A")).toMatch(/^Lantern light flickers/);
    expect(describeCamera(start(), attic, "C")).toMatch(/sits dark on a crate/);
    expect(describeCamera(lit, attic, "C")).toMatch(/bright, empty square.*low door is set/s);
    expect(describeCamera(done, attic, "C")).toMatch(/stands open on a narrow stair/);
  });

  it("skips the hints about steps already done", () => {
    const { state, last } = playGame(["open trunk", "open dress form", "hint"], start(), "en-US", LATER);
    expect(state.hints).toEqual([2]);
    expect(texts(last)).toEqual([`Hint 3/5: ${attic.hints![2].text}`]);
  });

  it("is translated", () => {
    const pt = run(["abrir baú", "virar", "caixa"], start("pt-BR"), "pt-BR");
    expect(texts(pt.log[0])).toContain("[Adicionado ao inventário: Programa: partida, tempestade, naufrágio, uma luz]");
    expect(texts(pt.last)[0]).toMatch(/^Uma caixa de madeira chata/);
    const ptWin = run(solution("attic", "pt-BR"), start("pt-BR"), "pt-BR");
    expect(ptWin.state.roomId).toBe("foyer");
    expect(texts(ptWin.last)[0]).toMatch(/grande saguão/);

    const es = run(["abrir maniquí", "girar", "abrir caja de placas", "cerillas linterna", "faro linterna"], start("es"), "es");
    expect(texts(es.log[3])[0]).toMatch(/^La cerilla se enciende/);
    expect(texts(es.last)[0]).toMatch(/\nLa linterna quiere la función entera, en el orden del programa\.$/);
    const esWin = run(["barco tormenta isla faro linterna", "abrir puerta"], es.state, "es");
    expect(esWin.state.roomId).toBe("foyer");
  });
});
