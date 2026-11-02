import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState } from "../../src/engine";
import type { Locale } from "../../src/i18n";
import { playGame, texts } from "../helpers";
import { solution } from "../solutions";

const at = (locale: Locale = "en-US") => createInitialState(loadGame(locale).rooms.greenhouse);
const run = (lines: string[], locale: Locale = "en-US") => playGame(lines, at(locale), locale);
const SOLUTION = solution("greenhouse");

describe("The Rooftop Greenhouse", () => {
  it("is solved by its solution and leads down to the nursery", () => {
    const { state, log } = run(SOLUTION);
    expect(texts(log[0])).toEqual([
      "The swollen doors scrape open.\nYou found an old watering can! It's bone dry.",
      "[Watering can added to inventory]",
    ]);
    expect(texts(log[4])).toContain("[Iron key added to inventory]");
    expect(texts(log[6])[0]).toBe(
      "The iron key grinds in the lock. The glass door swings open.\nNarrow stairs lead down into the house.",
    );
    expect(log[6]).toContainEqual(expect.objectContaining({ type: "room_entered", room: "nursery" }));
    expect(state).toMatchObject({ roomId: "nursery", inventory: [] });
  });

  it("the door stays locked without the key", () => {
    const { state, last } = run(["turn", "open door"]);
    expect(texts(last)).toEqual(["Locked. The iron lock won't give."]);
    const tries = run(["turn", "use key door", "use iron key door", "open door key"]);
    expect(tries.state.roomId).toBe("greenhouse");
    expect(state.roomId).toBe("greenhouse");
  });

  it("the pot's soil is too hard to dig by hand", () => {
    const { state, last } = run(["open pot"]);
    expect(texts(last)[0]).toContain("baked hard as stone");
    expect(state.inventory).toEqual([]);
    expect(texts(run(["inspect pot"]).last)[0]).toContain("Something metal glints");
  });

  it("an empty watering can does nothing to the pot", () => {
    const { state, last } = run(["open cabinet", "use watering can pot"]);
    expect(texts(last)).toEqual(["You tip the watering can. It's empty. Not a drop comes out."]);
    expect(state.flags.key_found).toBe(false);
    expect(state.inventory).toEqual(["watering_can"]);
  });

  it("filling twice says the can is already full; pouring empties it", () => {
    const full = run(["open cabinet", "turn", "use can barrel", "use can barrel"]);
    expect(texts(full.last)).toEqual(["The watering can is already full."]);
    expect(full.state.flags.can_full).toBe(true);
    const poured = run(SOLUTION.slice(0, 5));
    expect(poured.state.flags).toMatchObject({ can_full: false, key_found: true });
  });

  it("never hands out the can or the key twice", () => {
    const { state, last } = run([
      ...SOLUTION.slice(0, 5),
      "open cabinet",
      "turn",
      "use watering can barrel",
      "turn",
      "use watering can pot",
    ]);
    expect(texts(last)).toEqual(["The soil is already soaked."]);
    expect(state.inventory).toEqual(["watering_can", "iron_key"]);
    expect(texts(run([...SOLUTION.slice(0, 5), "open cabinet"]).last)).toEqual(["Only cobwebs left."]);
  });

  it("objects only work from their own camera", () => {
    expect(run(["use watering can barrel"]).last[0]).toMatchObject({ type: "failure", reason: "not_visible" });
    expect(run(["open cabinet", "turn", "use can pot"]).last[0]).toMatchObject({ reason: "not_visible" });
  });

  it("the bench camera mentions the wet soil once the key is found", () => {
    const before = run(["look"]);
    expect(texts(before.last)[0]).not.toContain("dark and wet");
    const after = run([...SOLUTION.slice(0, 5), "look"]);
    expect(texts(after.last)[0]).toContain("One pot's soil lies dark and wet.");
  });

  it("every visible thing can be inspected", () => {
    const a = ["inspect bench", "inspect pots", "inspect pot", "inspect cabinet", "inspect vines"];
    const c = ["inspect barrel", "inspect door", "inspect lock", "inspect broken glass", "inspect moonlight"];
    const { log } = run([...a, "turn", ...c]);
    log.forEach((events) => expect(events.find((e) => e.type === "failure")).toBeUndefined());
  });

  it("is translated", () => {
    expect(texts(run(["abrir o armário", "usar o regador no vaso"], "pt-BR").last)).toEqual([
      "Você inclina o regador. Está vazio. Não sai uma gota.",
    ]);
    expect(texts(run(["virar", "abrir a porta"], "pt-BR").last)).toEqual(["Trancada. A fechadura de ferro não cede."]);
    expect(texts(run(["abrir el armario", "usar la regadera en la maceta"], "es").last)).toEqual([
      "Inclinas la regadera. Está vacía. No sale ni una gota.",
    ]);
    expect(texts(run(["girar", "abrir la puerta"], "es").last)).toEqual([
      "Cerrada con llave. La cerradura de hierro no cede.",
    ]);
    const es = run(solution("greenhouse", "es"), "es");
    expect(es.state.roomId).toBe("nursery");
  });
});
