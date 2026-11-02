import { describe, expect, it } from "vitest";
import { loadGame } from "../src/content";
import {
  createGameState,
  formatCountdown,
  HINT_UNLOCK_MS,
  MAX_HINTS,
  stepGame,
  validateRoom,
} from "../src/engine";
import { LANGUAGES, LOCALES } from "../src/i18n";
import { game, playGame, STUDY_SOLUTION, studyJson, texts } from "./helpers";

const study = game.rooms.study;
const MIN = 60_000;
/** Long enough after the level started for every hint to be unlocked. */
const LATER = 7 * 60 * MIN;
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
    const { state, log } = playGame(["hint", "hint"], undefined, "en-US", LATER);
    expect(texts(log[0])).toEqual([`Hint 1/5: ${study.hints![0].text}`]);
    expect(texts(log[1])).toEqual([`Hint 2/5: ${study.hints![1].text}`]);
    expect(hintEvents(log[1])).toEqual([expect.objectContaining({ hint: 1 })]);
    expect(state.hints).toEqual([0, 1]);
  });

  it("skips hints about steps the player already solved", () => {
    const { state, last } = playGame(["use 0315 drawer", "hint"], undefined, "en-US", LATER);
    expect(state.hints).toEqual([3]);
    expect(texts(last)).toEqual([`Hint 4/5: ${study.hints![3].text}`]);
  });

  it("keeps hints already revealed even if their step gets solved later", () => {
    const { state } = playGame(["hint", "use 0315 drawer", "hint"], undefined, "en-US", LATER);
    expect(state.hints).toEqual([0, 3]);
  });

  it("says when there are no more hints, without changing anything", () => {
    const { state, last } = playGame(["hint", "hint", "hint", "hint", "hint", "hint"], undefined, "en-US", LATER);
    expect(state.hints).toEqual([0, 1, 2, 3, 4]);
    expect(texts(last)).toEqual(["There are no more hints for this room."]);
  });

  it("are per room: entering the next level starts with none revealed", () => {
    const { state } = playGame(["hint", ...STUDY_SOLUTION], undefined, "en-US", LATER);
    expect(state.roomId).toBe("cellar");
    expect(state.hints).toEqual([]);
    expect(state.levelStartedAt).toBe(LATER);
  });

  it("are translated", () => {
    expect(texts(playGame(["dica"], undefined, "pt-BR", LATER).last)).toEqual([
      "Dica 1/5: O tempo parece ter parado neste cômodo.",
    ]);
    expect(texts(playGame(["pista"], undefined, "es", LATER).last)).toEqual([
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

describe("hint unlock times", () => {
  const at = (minutes: number, lines: string[], start = createGameState(game)) =>
    playGame(lines, start, "en-US", minutes * MIN);

  it("follow the schedule: 10 min, 30 min, 1h30, 3h, 6h after the level starts", () => {
    expect(HINT_UNLOCK_MS).toEqual([10, 30, 90, 180, 360].map((m) => m * MIN));
    let state = createGameState(game);
    for (const [i, minutes] of [10, 30, 90, 180, 360].entries()) {
      const early = at(minutes - 1, ["hint"], state);
      expect(early.state.hints, `hint ${i + 1} at ${minutes - 1} min`).toHaveLength(i);
      state = at(minutes, ["hint"], state).state;
      expect(state.hints, `hint ${i + 1} at ${minutes} min`).toHaveLength(i + 1);
    }
  });

  it("asking early shows the time left as HH:MM:SS and changes nothing", () => {
    const start = createGameState(game);
    const { state, last } = at(0, ["hint"], start);
    expect(state).toEqual(start);
    expect(last).toEqual([
      { type: "hint_locked", availableAt: 10 * MIN, text: "Next hint available in 00:10:00" },
    ]);
    expect(texts(playGame(["hint"], start, "en-US", 10 * MIN - 1500).last)).toEqual([
      "Next hint available in 00:00:02",
    ]);
  });

  it("count from each level's start", () => {
    const inCellar = at(20, STUDY_SOLUTION).state; // cellar entered at 20 min
    expect(inCellar.levelStartedAt).toBe(20 * MIN);
    expect(texts(at(29, ["hint"], inCellar).last)).toEqual(["Next hint available in 00:01:00"]);
    expect(at(30, ["hint"], inCellar).state.hints).toEqual([0]);
  });

  it("depend on how many hints were revealed, not which (skipped hints don't count)", () => {
    const solvedDrawer = at(10, ["use 0315 drawer", "hint"]).state; // 1st reveal is hint #4
    expect(solvedDrawer.hints).toEqual([3]);
    expect(texts(at(29, ["hint"], solvedDrawer).last)[0]).toMatch(/^Next hint available in/);
  });

  it("can be given a different schedule (all zeros = no waiting)", () => {
    const start = createGameState(game);
    const step = (state: typeof start) =>
      stepGame(state, { verb: "hint" }, game, LANGUAGES["en-US"].engine, 0, HINT_UNLOCK_MS.map(() => 0)).state;
    let state = start;
    for (let i = 0; i < MAX_HINTS; i++) state = step(state);
    expect(state.hints).toEqual([0, 1, 2, 3, 4]);
  });

  it("are translated", () => {
    expect(texts(playGame(["dica"], undefined, "pt-BR", 0).last)).toEqual(["Próxima dica disponível em 00:10:00"]);
    expect(texts(playGame(["pista"], undefined, "es", 0).last)).toEqual(["Próxima pista disponible en 00:10:00"]);
  });

  it("formatCountdown rounds up to whole seconds and shows hours", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(1)).toBe("00:00:01");
    expect(formatCountdown(59_001)).toBe("00:01:00");
    expect(formatCountdown(360 * MIN)).toBe("06:00:00");
    expect(formatCountdown(-5)).toBe("00:00:00");
  });
});
