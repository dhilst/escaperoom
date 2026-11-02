import { describe, expect, it } from "vitest";
import { loadGame } from "../src/content";
import { createInitialState, MAX_HINTS, validateRoom } from "../src/engine";
import { LANGUAGES, LOCALES } from "../src/i18n";
import { game, playGame, STUDY_SOLUTION, studyJson, texts } from "./helpers";

const study = game.rooms.study;
const hintEvents = (events: { type: string }[]) => events.filter((e) => e.type === "hint_revealed");

describe("hints", () => {
  it("every room ships a full ladder of hints in every language", () => {
    for (const locale of LOCALES) {
      for (const room of Object.values(loadGame(locale).rooms)) {
        expect(room.hints?.length, `${locale} ${room.id}`).toBe(MAX_HINTS);
      }
    }
  });

  it("never give away an answer: no codes, numbers or commands", () => {
    for (const locale of LOCALES) {
      const { verbs } = LANGUAGES[locale].parser;
      for (const room of Object.values(loadGame(locale).rooms)) {
        for (const { text } of room.hints ?? []) {
          expect(text, `${locale} ${room.id}: ${text}`).not.toMatch(/\d/);
          // No ready-made commands such as "use 0315 drawer" / "usar ... na porta".
          const firstWords = text.toLowerCase().split(/[.:!?¡¿]\s*/).map((part) => part.split(/\s+/)[0]);
          expect(firstWords.filter((w) => w in verbs && verbs[w] === "use"), `${locale} ${room.id}: ${text}`).toEqual([]);
        }
      }
    }
  });

  it("reveals one hint at a time, in order", () => {
    const { state, log } = playGame(["hint", "hint"]);
    expect(texts(log[0])).toEqual([`Hint 1/5: ${study.hints![0].text}`]);
    expect(texts(log[1])).toEqual([`Hint 2/5: ${study.hints![1].text}`]);
    expect(hintEvents(log[1])).toEqual([expect.objectContaining({ hint: 1 })]);
    expect(state.hints).toEqual([0, 1]);
  });

  it("skips hints about steps the player already solved", () => {
    const { state, last } = playGame(["use 0315 drawer", "hint"]);
    expect(state.hints).toEqual([3]);
    expect(texts(last)).toEqual([`Hint 4/5: ${study.hints![3].text}`]);
  });

  it("keeps hints already revealed even if their step gets solved later", () => {
    const { state } = playGame(["hint", "use 0315 drawer", "hint"]);
    expect(state.hints).toEqual([0, 3]);
  });

  it("says when there are no more hints, without changing anything", () => {
    const { state, last } = playGame(["hint", "hint", "hint", "hint", "hint", "hint"]);
    expect(state.hints).toEqual([0, 1, 2, 3, 4]);
    expect(texts(last)).toEqual(["There are no more hints for this room."]);
  });

  it("are per room: entering the next level starts with none revealed", () => {
    const { state, last } = playGame(["hint", ...STUDY_SOLUTION, "hint"]);
    expect(state.roomId).toBe("cellar");
    expect(state.hints).toEqual([0]);
    expect(texts(last)[0]).toMatch(/^Hint 1\/5: /);
  });

  it("are translated", () => {
    expect(texts(playGame(["dica"], undefined, "pt-BR").last)).toEqual([
      "Dica 1/5: O tempo parece ter parado neste cômodo.",
    ]);
    expect(texts(playGame(["pista"], undefined, "es").last)).toEqual([
      "Pista 1/5: El tiempo parece haberse detenido en esta habitación.",
    ]);
  });

  it("validation rejects more than five hints and bad skip conditions", () => {
    const hint = { text: "x" };
    expect(() => validateRoom({ ...studyJson, hints: Array(MAX_HINTS + 1).fill(hint) })).toThrow(
      /hints has 6 entries; the maximum is 5/,
    );
    expect(() =>
      validateRoom({ ...studyJson, hints: [{ text: "x", skipIf: [{ type: "has_item", item: "nope" }] }] }),
    ).toThrow(/hints\[0\]\.skipIf\[0\]\.item "nope" is not a known item/);
    expect(() => validateRoom({ ...studyJson, hints: [{ text: "" }] })).toThrow(/hints\[0\]\.text/);
  });
});

describe("restart", () => {
  it("restarts the current level but keeps the hints revealed there", () => {
    const { state, last } = playGame(["hint", "use 0315 drawer", "turn", "restart"]);
    expect(state).toEqual({ ...createInitialState(study), hints: [0] });
    expect(last[0]).toEqual({ type: "restarted", text: "Level restarted." });
    expect(texts(last)[1]).toBe(study.cameras.A.description);
  });

  it("restarts only the current level, not the whole game", () => {
    const { state } = playGame([...STUDY_SOLUTION, "open toolbox", "restart"]);
    expect(state).toMatchObject({ roomId: "cellar", inventory: [], flags: { toolbox_open: false } });
  });

  it("after winning, starts a new game from the first room", () => {
    const win = [
      ...STUDY_SOLUTION,
      "open toolbox", "turn", "use crowbar crate", "turn", "use fuse fuse box", "turn", "use 7419 door",
      "open birdcage", "turn", "use crank music box", "turn", "use lens telescope", "turn", "use 2618 hatch",
    ];
    const { state, last } = playGame([...win, "hint", "restart"]);
    expect(state).toEqual(createInitialState(study));
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "study" }));
  });

  it("is translated", () => {
    expect(texts(playGame(["reiniciar"], undefined, "pt-BR").last)[0]).toBe("Fase reiniciada.");
    expect(texts(playGame(["reiniciar"], undefined, "es").last)[0]).toBe("Nivel reiniciado.");
  });
});
