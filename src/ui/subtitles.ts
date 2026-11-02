export type LineKind = "response" | "item" | "error" | "success" | "hint";

export interface SubtitleLine {
  text: string;
  kind: LineKind;
  /** Recomputes the text while the subtitle is up (e.g. a ticking countdown). Keep its length stable. */
  live?: () => string;
}

/** Milliseconds per typed character. */
export const TYPE_MS = 30;
/** How long a fully typed subtitle stays on screen. */
export const HOLD_MS = 5000;
/** Fade-out duration; keep in sync with the .subtitle transition in style.css. */
export const FADE_MS = 400;
/** Refresh rate for live lines once typing is done. */
const LIVE_MS = 250;

/**
 * Resident Evil-style subtitles: the response types itself out over the bottom
 * of the camera view, stays for HOLD_MS once complete, then fades. A new
 * subtitle replaces the current one immediately. All lines of a response flow
 * as one paragraph (line breaks become spaces); each keeps its color.
 *
 * The full text goes to a separate live region at once, so screen readers
 * don't have to follow the animation; with reduced motion the text appears
 * without typing.
 */
export class Subtitles {
  private frame = 0;
  private timer = 0;
  private ticker = 0;

  constructor(
    private readonly box: HTMLElement,
    private readonly live: HTMLElement,
  ) {}

  show(lines: SubtitleLine[]): void {
    cancelAnimationFrame(this.frame);
    clearTimeout(this.timer);
    clearInterval(this.ticker);
    if (lines.length === 0) return;

    const oneLine = (text: string) => text.replace(/\s*\n\s*/g, " ");

    // Each line holds a typed part and a hidden remainder, so the band has its
    // final size from the start and the text doesn't reflow while typing.
    const parts = lines.map((line, i) => {
      const gap = i < lines.length - 1 ? " " : "";
      const current = () => oneLine(line.live ? line.live() : line.text) + gap;
      const el = document.createElement("span");
      el.className = `line ${line.kind}`;
      const typed = document.createElement("span");
      const rest = document.createElement("span");
      rest.className = "rest";
      el.append(typed, rest);
      return { el, typed, rest, current };
    });
    this.live.textContent = parts.map((p) => p.current()).join("");
    this.box.replaceChildren(...parts.map((p) => p.el));
    this.box.classList.remove("fading");
    this.box.hidden = false;

    const render = (shown: number) => {
      for (const { typed, rest, current } of parts) {
        const text = current();
        const n = Math.max(0, Math.min(text.length, shown));
        typed.textContent = text.slice(0, n);
        rest.textContent = text.slice(n);
        shown -= text.length;
      }
    };

    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const tick = (now: number) => {
      const total = parts.reduce((n, p) => n + p.current().length, 0);
      const shown = instant ? total : Math.floor((now - start) / TYPE_MS);
      render(shown);
      if (shown < total) {
        this.frame = requestAnimationFrame(tick);
        return;
      }
      if (lines.some((l) => l.live)) {
        this.ticker = window.setInterval(() => render(Infinity), LIVE_MS);
      }
      this.timer = window.setTimeout(() => this.fade(), HOLD_MS);
    };
    tick(start);
  }

  private fade(): void {
    this.box.classList.add("fading");
    this.timer = window.setTimeout(() => {
      clearInterval(this.ticker);
      this.box.hidden = true;
      this.box.classList.remove("fading");
    }, FADE_MS);
  }
}
