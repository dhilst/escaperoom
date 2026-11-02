import "./ui/style.css";
import studyJson from "../rooms/study/room.json";
import {
  buildAliasMap,
  createInitialState,
  parse,
  step,
  validateRoom,
  type GameEvent,
  type GameState,
  type RoomDefinition,
} from "./engine";
import { Renderer, type LineKind } from "./ui/renderer";

// Every image under rooms/<id>/ is bundled; room.json refers to them by file name.
const roomImages = import.meta.glob<string>("../rooms/*/*.{png,webp,jpg}", {
  eager: true,
  query: "?url",
  import: "default",
});

const ui = new Renderer();

function imageUrl(room: RoomDefinition, file: string): string {
  const url = roomImages[`../rooms/${room.id}/${file}`];
  if (!url) throw new Error(`Image "${file}" not found in rooms/${room.id}/`);
  return url;
}

function lineKind(event: GameEvent): LineKind {
  switch (event.type) {
    case "item_added":
      return "item";
    case "game_completed":
      return "success";
    default:
      return "response";
  }
}

function start(room: RoomDefinition): void {
  const aliases = buildAliasMap(room);
  const history: string[] = [];
  let historyIndex = 0;
  let state: GameState;

  const render = () => {
    const camera = room.cameras[state.camera];
    ui.showCamera(state.camera, imageUrl(room, camera.image), camera.description);
    ui.setInventory(state.inventory.map((id) => room.items[id]?.name ?? id));
    ui.setCompleted(state.completed);
  };

  const reset = () => {
    state = createInitialState(room);
    ui.clearLog();
    ui.setTitle(room.title);
    ui.print(room.cameras[state.camera].description, "response");
    render();
    ui.focusInput();
  };

  const submit = (input: string) => {
    if (input.trim() === "") return;
    history.push(input);
    historyIndex = history.length;
    ui.print(input.trim(), "command");

    const parsed = parse(input, aliases);
    if (!parsed.ok) {
      ui.print(parsed.error, "error");
      return;
    }
    const result = step(state, parsed.command, room);
    state = result.state;
    for (const event of result.events) {
      if ("text" in event) ui.print(event.text, lineKind(event));
    }
    render();
  };

  ui.form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(ui.input.value);
    ui.input.value = "";
    ui.focusInput();
  });

  // Up/Down recall previous commands.
  ui.input.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (e.key === "ArrowUp" ? -1 : 1)));
    ui.input.value = history[historyIndex] ?? "";
  });

  ui.restartButton.addEventListener("click", reset);
  reset();
}

try {
  start(validateRoom(studyJson));
} catch (error) {
  ui.print(String(error instanceof Error ? error.message : error), "error");
  console.error(error);
}
