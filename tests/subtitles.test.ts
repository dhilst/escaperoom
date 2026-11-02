import { describe, expect, it } from "vitest";
import { charDelayMs, DEFAULT_WPM, wpmFromParam } from "../src/ui/subtitles";

describe("subtitle typing speed", () => {
  it("is measured in words per minute (5 characters per word)", () => {
    expect(charDelayMs(200)).toBe(60); // 200 wpm = 1000 chars/min
    expect(charDelayMs(400)).toBe(30);
    expect(charDelayMs(60)).toBe(200);
  });

  it("defaults to 200 wpm", () => {
    expect(DEFAULT_WPM).toBe(200);
  });

  it("reads ?wpm=, ignoring missing or unreasonable values", () => {
    expect(wpmFromParam("120")).toBe(120);
    expect(wpmFromParam("62.5")).toBe(62.5);
    for (const bad of [null, undefined, "", "fast", "0", "-50", "5", "99999", "Infinity"]) {
      expect(wpmFromParam(bad), String(bad)).toBe(DEFAULT_WPM);
    }
  });
});
