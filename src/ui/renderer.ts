import type { CameraId } from "../engine";

export type LineKind = "command" | "response" | "item" | "error" | "success";

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
  readonly restartButton = byId<HTMLButtonElement>("restart");

  setTitle(gameTitle: string, roomTitle: string, level: number, levels: number): void {
    this.title.textContent = roomTitle;
    this.level.textContent = `${gameTitle} · Level ${level}/${levels}`;
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
