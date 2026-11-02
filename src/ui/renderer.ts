import type { CameraId } from "../engine";
import type { UiStrings } from "../i18n";

import { Subtitles, type SubtitleLine } from "./subtitles";

export type { LineKind, SubtitleLine } from "./subtitles";

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
  private readonly subtitles = new Subtitles(byId("subtitle"), byId("subtitle-live"));
  readonly form = byId<HTMLFormElement>("command-form");
  readonly input = byId<HTMLInputElement>("command-input");
  private readonly inventoryHeading = byId<HTMLElement>("inventory-heading");
  private readonly hints = byId<HTMLElement>("hints");
  private readonly hintHeading = byId<HTMLElement>("hint-heading");
  private readonly hintList = byId<HTMLOListElement>("hint-list");

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
   * Revealed hints stay on screen for the rest of the level, in a box under
   * the camera view. The box appears with the first hint (hint is a hidden
   * command); the layout always reserves room for it, so nothing moves.
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

  /** Show one command's response as a typed subtitle over the camera view. */
  say(lines: SubtitleLine[]): void {
    this.subtitles.show(lines);
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
