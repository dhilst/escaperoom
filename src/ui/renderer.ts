import type { CameraId } from "../engine";
import type { UiStrings } from "../i18n";

export type LineKind = "command" | "response" | "item" | "error" | "success" | "hint";

/** A revealed hint: its position in the room's ladder (1-based) and its text. */
export interface ShownHint {
  number: number;
  text: string;
}

/** All DOM access lives here. It knows nothing about game rules. */
export class Renderer {
  private readonly title = byId<HTMLHeadingElement>("room-title");
  private readonly level = byId<HTMLElement>("level");
  private readonly image = byId<HTMLImageElement>("camera-image");
  private readonly cameraLabel = byId<HTMLElement>("camera-label");
  private readonly banner = byId<HTMLElement>("banner");
  private readonly inventory = byId<HTMLUListElement>("inventory-list");
  private readonly log = byId<HTMLElement>("log");
  readonly form = byId<HTMLFormElement>("command-form");
  readonly input = byId<HTMLInputElement>("command-input");
  private readonly inventoryHeading = byId<HTMLElement>("inventory-heading");
  private readonly hints = byId<HTMLElement>("hints");
  private readonly hintHeading = byId<HTMLElement>("hint-heading");
  private readonly hintList = byId<HTMLOListElement>("hint-list");

  constructor() {
    // The camera view shrinks by the hint box's height (plus the layout gap)
    // so the input never leaves the screen.
    const game = this.hints.parentElement!;
    new ResizeObserver(() => {
      const height = this.hints.offsetHeight;
      game.style.setProperty("--hints-height", `${height ? height + 10 : 0}px`);
    }).observe(this.hints);
  }
  private strings!: UiStrings;

  /** Apply the interface language: static labels and the document language. */
  setLanguage(locale: string, strings: UiStrings): void {
    this.strings = strings;
    document.documentElement.lang = locale;
    this.inventoryHeading.textContent = strings.items;
    this.input.placeholder = strings.placeholder;
    this.banner.textContent = strings.banner;
  }

  setTitle(gameTitle: string, roomTitle: string, level: number, levels: number): void {
    this.title.textContent = roomTitle;
    this.level.textContent = `${gameTitle} · ${this.strings.level(level, levels)}`;
    document.title = `${roomTitle} — ${gameTitle}`;
  }

  showCamera(camera: CameraId, url: string, alt: string): void {
    this.image.src = url;
    this.image.alt = alt;
    this.cameraLabel.textContent = `CAM ${camera}`;
  }

  setInventory(names: string[]): void {
    this.inventory.replaceChildren(
      ...(names.length > 0 ? names : ["—"]).map((name) => {
        const li = document.createElement("li");
        li.textContent = name;
        return li;
      }),
    );
  }

  /**
   * Revealed hints stay on screen for the rest of the level, in a box above
   * the log. The box appears with the first hint (hint is a hidden command).
   */
  setHints(hints: ShownHint[], total: number): void {
    this.hints.hidden = hints.length === 0;
    this.hintHeading.textContent = `${this.strings.hints} ${hints.length}/${total}`;
    this.hintList.replaceChildren(
      ...hints.map(({ number, text }) => {
        const li = document.createElement("li");
        li.value = number;
        li.textContent = text;
        return li;
      }),
    );
  }

  setCompleted(completed: boolean): void {
    this.banner.hidden = !completed;
  }

  clearLog(): void {
    this.log.replaceChildren();
  }

  /** Append one entry. Only the newest response is highlighted. */
  print(text: string, kind: LineKind): void {
    if (kind === "command") {
      this.log.querySelectorAll(".latest").forEach((el) => el.classList.remove("latest"));
    }
    const p = document.createElement("p");
    p.className = `line ${kind}${kind === "command" ? "" : " latest"}`;
    p.textContent = kind === "command" ? `> ${text}` : text;
    this.log.append(p);
    this.log.scrollTop = this.log.scrollHeight;
  }

  focusInput(): void {
    this.input.focus();
  }
}

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el as T;
}
