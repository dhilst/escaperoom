import { describe, expect, it } from "vitest";
import { loadGame } from "../../src/content";
import { createInitialState, describeCamera, roomBrightness } from "../../src/engine";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const kitchen = game.rooms.kitchen;
const at = () => createInitialState(kitchen);
const SOLUTION = solution("kitchen");
/** Up to the stove being lit (icebox, drawer, matches). */
const LIT = SOLUTION.slice(0, 5);

describe("The Kitchen", () => {
  it("can be solved and leads to the laundry", () => {
    const { state, log, last } = playGame(SOLUTION, at());
    expect(texts(log[0])).toContain("[Ice block added to inventory]");
    expect(texts(log[2])).toContain("[Matches added to inventory]");
    expect(texts(log[4])).toContain("[Matches removed from inventory]");
    expect(texts(log[5])).toEqual([
      "You set the ice on the burner. It hisses, sweats, and splits apart.\nYou found the hall key!",
      "[Ice block removed from inventory]",
      "[Hall key added to inventory]",
    ]);
    expect(texts(last)[0]).toMatch(/narrow service passage\.\nIt smells of lye and old steam\.$/);
    expect(last).toContainEqual(expect.objectContaining({ type: "room_entered", room: "laundry" }));
    expect(state).toMatchObject({ roomId: "laundry", completed: false });
  });

  it("the ice won't melt on a cold stove", () => {
    const { state, last } = playGame(["open icebox", "ice block stove"], at());
    expect(texts(last)).toEqual(["The stove is cold."]);
    expect(state.inventory).toEqual(["ice_block"]);
    expect(state.flags.key_thawed).toBe(false);
  });

  it("the stove reads differently cold and lit", () => {
    expect(texts(playGame(["stove"], at()).last)[0]).toMatch(/cold as a grave/);
    const lit = playGame([...LIT, "burner"], at());
    expect(texts(lit.last)).toEqual(["The burner roars. Heat rolls off the black iron."]);
  });

  it("the door is locked until the key is thawed out", () => {
    const { state, last } = playGame(["turn", "open door", "key door"], at());
    expect(texts(playGame(["turn", "open door"], at()).last)).toEqual(["It's locked."]);
    expect(texts(last)).not.toContain("It's locked.");
    expect(state.roomId).toBe("kitchen");
    // Holding the frozen block is not enough either.
    expect(playGame(["open icebox", "turn", "ice door", "open door"], at()).state.roomId).toBe("kitchen");
  });

  it("each cupboard gives its prize once", () => {
    const { state } = playGame(
      ["open icebox", "open icebox", "turn", "open drawer", "open drawer", "open dresser"],
      at(),
    );
    expect(state.inventory).toEqual(["ice_block", "matches"]);
    const after = playGame([...LIT, "open icebox", "ice stove", "ice stove"], at()).state;
    expect(after.inventory).toEqual(["hall_key"]);
  });

  it("objects belong to their camera", () => {
    expect(texts(playGame(["drawer"], at()).last)[0]).toMatch(/don't see any drawer here/);
    expect(texts(playGame(["turn", "icebox"], at()).last)[0]).toMatch(/don't see any icebox here/);
    expect(texts(playGame(["open drawer"], at()).last)).toEqual(["Nothing happens."]);
  });

  it("every visible object can be inspected", () => {
    for (const name of ["sink", "pipe", "fridge"]) {
      expect(texts(playGame([name], at()).last)[0], name).not.toMatch(/no such|Nothing special/);
    }
    for (const name of ["dresser", "plates", "pots", "rack", "keyhole"]) {
      expect(texts(playGame(["turn", name], at()).last)[0], name).not.toMatch(/no such|Nothing special/);
    }
  });

  it("is dark until the stove is lit, and the views change with the flame", () => {
    const dark = at();
    expect(roomBrightness(dark, kitchen)).toBe(0.4);
    const lit = playGame(LIT, dark).state;
    expect(lit.flags.stove_lit).toBe(true);
    expect(roomBrightness(lit, kitchen)).toBe(1.05);
    expect(describeCamera(dark, kitchen, "A")).toMatch(/A cold iron stove/);
    expect(describeCamera(lit, kitchen, "A")).toMatch(/The iron stove burns/);
    expect(describeCamera(dark, kitchen, "C")).not.toMatch(/firelight/);
    expect(describeCamera(lit, kitchen, "C")).toMatch(/firelight/);
  });

  it("is translated", () => {
    const pt = loadGame("pt-BR").rooms.kitchen;
    const es = loadGame("es").rooms.kitchen;
    expect(
      texts(playGame(["abrir geladeira", "gelo fogão"], createInitialState(pt), "pt-BR").last),
    ).toEqual(["O fogão está frio."]);
    expect(
      texts(playGame(["abrir nevera", "hielo fogón"], createInitialState(es), "es").last),
    ).toEqual(["El fogón está frío."]);
    expect(texts(playGame(["virar", "abrir porta"], createInitialState(pt), "pt-BR").last)).toEqual([
      "Está trancada.",
    ]);
    expect(texts(playGame(["girar", "abrir puerta"], createInitialState(es), "es").last)).toEqual([
      "Está cerrada con llave.",
    ]);
  });
});
