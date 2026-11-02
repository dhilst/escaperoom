export type LineKind = "response" | "item" | "error" | "success" | "hint";

export interface SubtitleLine {
  text: string;
  kind: LineKind;
}

/** Milliseconds per typed character. */
export const TYPE_MS = 30;
/** How long a fully typed subtitle stays on screen. */
export const HOLD_MS = 5000;
/** Fade-out duration; keep in sync with the .subtitle transition in style.css. */
export const FADE_MS = 400;

/**
 * Resident Evil-style subtitles: the response types itself out over the bottom
 * of the camera view, stays for HOLD_MS once complete, then fades. A new
 * subtitle replaces the current one immediately.
 *
 * The full text goes to a separate live region at once, so screen readers
 * don't have to follow the animation; with reduced motion the text appears
 * without typing.
 */
export class Subtitles {
  private frame = 0;
  private timer = 0;

  constructor(
    private readonly box: HTMLElement,
    private readonly live: HTMLElement,
  ) {}

  show(lines: SubtitleLine[]): void {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.timer);
    if (lines.length === 0) return;

    // One flowing paragraph: line breaks inside texts and between the lines of
    // a response become spaces (colors per line are kept).
    const flat = lines.map((l, i) => ({
      kind: l.kind,
      text: l.text.replace(/\s*\n\s*/g, " ") + (i < lines.length - 1 ? " " : ""),
    }));
    this.live.textContent = flat.map((l) => l.text).join("");

    // Each line holds a typed part and a hidden remainder, so the band has its
    // final size from the start and the text doesn't reflow while typing.
    const parts = flat.map(({ text, kind }) => {
      const line = document.createElement("span");
      line.className = `line ${kind}`;
      const typed = document.createElement("span");
      const rest = document.createElement("span");
      rest.className = "rest";
      rest.textContent = text;
      line.append(typed, rest);
      return { text, typed, rest };
    });
    this.box.replaceChildren(...parts.map((p) => p.typed.parentElement!));
    this.box.classList.remove("fading");
    this.box.hidden = false;

    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = parts.reduce((n, p) => n + p.text.length, 0);
    const start = performance.now();

    const tick = (now: number) => {
      let shown = instant ? total : Math.floor((now - start) / TYPE_MS);
      const done = shown >= total;
      for (const { text, typed, rest } of parts) {
        const n = Math.max(0, Math.min(text.length, shown));
        typed.textContent = text.slice(0, n);
        rest.textContent = text.slice(n);
        shown -= text.length;
      }
      if (done) this.timer = window.setTimeout(() => this.fade(), HOLD_MS);
      else this.frame = requestAnimationFrame(tick);
    };
    tick(start);
  }

  private fade(): void {
    this.box.classList.add("fading");
    this.timer = window.setTimeout(() => {
      this.box.hidden = true;
      this.box.classList.remove("fading");
    }, FADE_MS);
  }
}
