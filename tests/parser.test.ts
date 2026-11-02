import { describe, expect, it } from "vitest";
import { parse } from "../src/engine";
import { aliases } from "./helpers";

/** The parsed command, minus `typed` (checked separately below). */
const ok = (input: string) => {
  const r = parse(input, aliases);
  if (!r.ok) throw new Error(r.error);
  const { typed: _typed, ...command } = r.command as { typed?: string };
  return command;
};

describe("parser", () => {
  it("parses argument-less commands", () => {
    expect(ok("look")).toEqual({ verb: "look" });
    expect(ok("turn")).toEqual({ verb: "turn" });
    expect(ok("inventory")).toEqual({ verb: "inventory" });
  });

  it("parses object commands", () => {
    expect(ok("inspect clock")).toEqual({ verb: "inspect", object: "clock" });
    expect(ok("open drawer")).toEqual({ verb: "open", object: "drawer" });
  });

  it("parses use with items and codes", () => {
    expect(ok("use key door")).toEqual({ verb: "use", item: "brass_key", target: "door" });
    expect(ok("use 0315 drawer")).toEqual({ verb: "use", item: "0315", target: "drawer" });
  });

  it("is case-insensitive", () => {
    expect(ok("LOOK")).toEqual({ verb: "look" });
    expect(ok("Inspect CLOCK")).toEqual({ verb: "inspect", object: "clock" });
  });

  it("tolerates extra whitespace", () => {
    expect(ok("   inspect    clock  ")).toEqual({ verb: "inspect", object: "clock" });
    expect(ok("\tuse  key \t door ")).toEqual({ verb: "use", item: "brass_key", target: "door" });
  });

  it("resolves single- and multi-word aliases", () => {
    expect(ok("inspect dusty clock")).toEqual({ verb: "inspect", object: "clock" });
    expect(ok("inspect shelf")).toEqual({ verb: "inspect", object: "bookshelf" });
    expect(ok("use brass key exit door")).toEqual({ verb: "use", item: "brass_key", target: "door" });
    expect(ok("use brass_key door")).toEqual({ verb: "use", item: "brass_key", target: "door" });
  });

  it("passes unknown objects through for the engine to reject", () => {
    expect(ok("inspect painting")).toEqual({ verb: "inspect", object: "painting" });
  });

  it("keeps the player's wording of the object, minus articles", () => {
    const typed = (input: string) => {
      const r = parse(input, aliases);
      return r.ok && "typed" in r.command ? r.command.typed : undefined;
    };
    expect(typed("inspect the Old Painting")).toBe("old painting");
    expect(typed("use key on the WOODEN chest")).toBe("wooden chest");
    expect(typed("inspect clock")).toBe("clock");
  });

  it("parses the hidden hint command and help", () => {
    expect(ok("hint")).toEqual({ verb: "hint" });
    expect(ok("HELP")).toEqual({ verb: "help" });
    expect(parse("hint please", aliases)).toEqual({ ok: false, error: "Usage: hint" });
  });

  it("has no restart command (it would undo everyone's progress in collective play)", () => {
    expect(parse("restart", aliases).ok).toBe(false);
  });

  it("does not advertise the hidden commands", () => {
    const r = parse("dance", aliases);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).not.toContain("hint");
    }
  });

  it("rejects unknown verbs and empty input", () => {
    expect(parse("dance", aliases).ok).toBe(false);
    expect(parse("take key", aliases).ok).toBe(false);
    expect(parse("", aliases).ok).toBe(false);
    expect(parse("    ", aliases).ok).toBe(false);
  });

  it("rejects missing or extra arguments with a usage message", () => {
    expect(parse("inspect", aliases)).toEqual({ ok: false, error: "Usage: inspect <object>" });
    expect(parse("open", aliases)).toEqual({ ok: false, error: "Usage: open <object>" });
    expect(parse("use key", aliases)).toEqual({ ok: false, error: "Usage: use <item> <target>" });
    expect(parse("use", aliases).ok).toBe(false);
    expect(parse("look around", aliases)).toEqual({ ok: false, error: "Usage: look" });
  });

  it("works without an alias table", () => {
    expect(parse("inspect clock")).toEqual({ ok: true, command: { verb: "inspect", object: "clock", typed: "clock" } });
  });
});
