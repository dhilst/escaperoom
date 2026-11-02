import { describe, expect, it } from "vitest";
import { createInitialState, describeCamera } from "../../src/engine";
import { game, playGame, texts } from "../helpers";
import { solution } from "../solutions";

const room = game.rooms.library;
const start = () => createInitialState(room);
const SOLUTION = solution("library");
const UNCHAINED = ["turn", "open book", "small key atlas"];

describe("The Library", () => {
  it("is solved by the intended chain and leads to the chapel", () => {
    const { state, log } = playGame(SOLUTION, start());
    expect(texts(log[0])).toEqual([
      "Rows of crumbling books, floor to ceiling. One shelf has a gap the width of a large volume.\nA small brass label beneath it reads ASTRONOMY.",
      "[Shelf label: ASTRONOMY added to inventory]",
    ]);
    expect(texts(log[2])).toEqual([
      "The cover lifts on a hollow cut into the pages.\nYou found a small key!",
      "[Small key added to inventory]",
    ]);
    expect(texts(log[3])).toEqual([
      "The key turns with a dry click. The chain slithers off the table.\nYou take the star atlas. It's heavier than it looks.",
      "[Small key removed from inventory]",
      "[Star atlas added to inventory]",
    ]);
    expect(texts(log[5])[0]).toBe(
      "You slide the atlas into the gap. Something clicks deep in the wall.\nThe bookshelf swings inward on a hidden hinge. A cold draft smelling of incense blows through.",
    );
    expect(log[5]).toContainEqual(expect.objectContaining({ type: "room_entered", room: "chapel" }));
    expect(state).toMatchObject({ roomId: "chapel", inventory: [], completed: false });
  });

  it("the atlas is chained until the padlock is opened", () => {
    expect(texts(playGame(["turn", "open atlas"], start()).last)).toEqual([
      "You tug at the atlas. The chain snaps taut.\nA small padlock holds it to the table.",
    ]);
    expect(texts(playGame(["turn", "padlock"], start()).last)[0]).toContain("small padlock");
    const { state } = playGame(["turn", "open atlas", "atlas", "table"], start());
    expect(state.inventory).toEqual([]);
    expect(state.flags.atlas_taken).toBe(false);
  });

  it("the small key has to be found before it can be used", () => {
    const { state, last } = playGame(["turn", "small key atlas"], start());
    expect(last).toContainEqual(expect.objectContaining({ type: "failure" }));
    expect(state.flags.atlas_taken).toBe(false);
  });

  it("only the loose chain remains once the atlas is taken", () => {
    const loose = "Only the loose chain remains on the table.";
    const { state, log } = playGame([...UNCHAINED, "atlas", "table", "open atlas"], start());
    expect(texts(log[3])).toEqual([loose]);
    expect(texts(log[4])).toEqual([loose]);
    expect(texts(log[5])).toEqual([loose]);
    expect(describeCamera(state, room)).toBe(
      "A loose chain lies coiled on the reading table.\nA cart of returned books waits beneath a tall window.",
    );
    expect(texts(playGame(["star atlas"], state).last)).toEqual([
      "A heavy volume of star charts. The spine reads ASTRONOMY.",
    ]);
  });

  it("the key can also be used on the table", () => {
    expect(playGame(["turn", "open book", "key table"], start()).state.inventory).toEqual(["star_atlas"]);
  });

  it("never hands out a second key or atlas", () => {
    const { state, last } = playGame(
      ["turn", "open book", "open book", "small key atlas", "small key atlas", "open book"],
      start(),
    );
    expect(texts(last)).toEqual(["The hollow is empty."]);
    expect(state.inventory).toEqual(["star_atlas"]);
  });

  it("the bookcase does not open without the atlas", () => {
    const { state, last } = playGame(["open shelves", "atlas shelves"], start());
    expect(texts(last)).toEqual(["Nothing happens."]);
    expect(state.roomId).toBe("library");
  });

  it("the shelves only work from camera A and the atlas only from camera C", () => {
    expect(texts(playGame(["atlas"], start()).last)).toEqual(["You don't see any atlas here."]);
    const atC = playGame([...UNCHAINED, "atlas shelves"], start());
    expect(texts(atC.last)).toEqual(["Nothing happens."]);
    expect(atC.state.roomId).toBe("library");
  });

  it("notes the shelf label once", () => {
    const { state } = playGame(["gap", "label"], start());
    expect(state.inventory).toEqual(["label_note"]);
  });

  it("is translated", () => {
    const pt = playGame(["virar", "abrir livro", "atlas"], start(), "pt-BR");
    expect(texts(pt.log[1])[0]).toBe("A capa se abre sobre um buraco escavado nas páginas.\nVocê encontrou uma chave pequena!");
    expect(texts(pt.last)[0]).toContain("cadeado pequeno");
    const es = playGame(["girar", "abrir libro", "llave candado"], start(), "es");
    expect(texts(es.last)[0]).toBe(
      "La llave gira con un chasquido seco. La cadena resbala de la mesa.\nTomas el atlas celeste. Pesa más de lo que parece.",
    );
    const exit = playGame(["girar", "atlas celeste estantería"], es.state, "es");
    expect(texts(exit.last)[0]).toContain("bisagra oculta");
    expect(exit.state.roomId).toBe("chapel");
  });
});
