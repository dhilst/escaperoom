export type LineKind = "response" | "item" | "error" | "success" | "hint";

export interface SubtitleLine {
  text: string;
  kind: LineKind;
  /** Recomputes the text while the subtitle is up (e.g. a ticking countdown). Keep its length stable. */
  live?: () => string;
}

/** Default typing speed, in words per minute (a word = 5 characters, the usual convention). */
export const DEFAULT_WPM = 200;
const CHARS_PER_WORD = 5;

/** Milliseconds per typed character at `wpm` words per minute. */
export function charDelayMs(wpm: number): number {
  return 60_000 / (wpm * CHARS_PER_WORD);
}

/** The ?wpm= query parameter: a number from 10 to 5000, otherwise the default. */
export function wpmFromParam(value: string | null | undefined): number {
  const wpm = Number(value);
  return value && Number.isFinite(wpm) && wpm >= 10 && wpm <= 5000 ? wpm : DEFAULT_WPM;
}
/** How long a fully typed subtitle stays on screen. */
export const HOLD_MS = 10_000;
/** The help text is longer and worth reading twice: it stays up longer. */
export const HELP_HOLD_MS = 15_000;
/** Fade-out duration; keep in sync with the .subtitle transition in style.css. */
export const FADE_MS = 400;
/** Bottom padding of the band, kept clear below the line being typed (see .subtitle in style.css). */
const BAND_PADDING_PX = 10;
/** Refresh rate for live lines once typing is done. */
const LIVE_MS = 250;

/**
 * Resident Evil-style subtitles: the response types itself out over the bottom
 * of the camera view at `wpm` words per minute, scrolling to follow the text
 * when it's longer than the band, stays for HOLD_MS (or `holdMs`) once complete, then fades. A new
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
  /** Typing speed in words per minute. */
  wpm = DEFAULT_WPM;

  constructor(
    private readonly box: HTMLElement,
    private readonly live: HTMLElement,
  ) {}

  show(lines: SubtitleLine[], holdMs = HOLD_MS): void {
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
    this.box.scrollTop = 0;

    // Long texts don't fit the band: keep the line being typed in view.
    const follow = () => {
      const active = parts.find((p) => p.rest.textContent !== "") ?? parts[parts.length - 1];
      const rects = active.typed.getClientRects();
      const last = rects[rects.length - 1];
      if (!last) return;
      const overflow = last.bottom - this.box.getBoundingClientRect().bottom + BAND_PADDING_PX;
      if (overflow > 0) this.box.scrollTop += overflow;
    };

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
      const shown = instant ? total : Math.floor((now - start) / charDelayMs(this.wpm));
      render(shown);
      follow();
      if (shown < total) {
        this.frame = requestAnimationFrame(tick);
        return;
      }
      if (lines.some((l) => l.live)) {
        this.ticker = window.setInterval(() => render(Infinity), LIVE_MS);
      }
      this.timer = window.setTimeout(() => this.fade(), holdMs);
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
