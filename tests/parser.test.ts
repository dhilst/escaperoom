import { describe, expect, it } from "vitest";
import { parse } from "../src/engine";
import { aliases } from "./helpers";

const ok = (input: string) => {
  const r = parse(input, aliases);
  if (!r.ok) throw new Error(r.error);
  return r.command;
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
    expect(parse("inspect clock")).toEqual({ ok: true, command: { verb: "inspect", object: "clock" } });
  });
});
