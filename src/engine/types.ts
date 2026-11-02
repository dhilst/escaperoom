// Core types shared by the parser, the engine and the UI.

export type CameraId = "A" | "C";
export type FlagValue = boolean | string | number;

// ---------------------------------------------------------------------------
// Commands (parser output)
// ---------------------------------------------------------------------------

/** Words every room understands. Rooms add their own objects, items and verbs. */
export const GLOBAL_WORDS = ["look", "turn", "open", "inventory", "help", "hint"] as const;
export type GlobalWord = (typeof GLOBAL_WORDS)[number];

/**
 * A command is a phrase: a sequence of words. Each word is an id (a global
 * word, or one of the room's objects, items or verbs) or, when the player
 * typed something the room doesn't know, the literal text (e.g. a code
 * "0315"). `typed` holds what the player actually wrote for each word, for
 * messages like "There is no such ...".
 *
 * One object word looks at it, one item word describes it, and longer
 * phrases ("key door", "open toolbox") must match a room rule exactly.
 */
export interface Command {
  words: string[];
  typed?: string[];
}

/** Everything the parser needs to understand one human language. */
export interface ParserLanguage {
  /** Typed word -> global word. Several words may map to the same one. */
  words: Record<string, GlobalWord>;
  empty: string;
}

/** Player-facing text produced by the engine itself (room text comes from room data). */
export interface EngineMessages {
  nothingSpecial: string;
  nothingHappens: string;
  turned: string;
  emptyInventory: string;
  itemAdded(name: string): string;
  itemRemoved(name: string): string;
  /** Unknown object name, e.g. "There is no such painting." */
  noSuchObject(typed: string): string;
  /** A real object that only the other camera can see, or an item not carried. */
  notVisible(typed: string): string;
  /** Answer to "help": the documented commands (not hint). */
  help: string;
  hint(number: number, total: number, text: string): string;
  /** `countdown` is already formatted as HH:MM:SS. */
  hintLocked(countdown: string): string;
  noMoreHints: string;
  escaped: string;
  alreadyEscaped: string;
}

export type ParseResult =
  | { ok: true; command: Command }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export interface GameState {
  roomId: string;
  camera: CameraId;
  inventory: string[];
  flags: Record<string, FlagValue>;
  completed: boolean;
  /** Indices into the current room's `hints`, in the order they were revealed. */
  hints: number[];
  /** When the current level began (ms, host clock). Hint unlock times count from here. */
  levelStartedAt: number;
}

// ---------------------------------------------------------------------------
// Room definitions (loaded from JSON)
// ---------------------------------------------------------------------------

export type Condition =
  | { type: "flag_equals"; flag: string; value: FlagValue }
  | { type: "has_item"; item: string };

export type Effect =
  | { type: "set_flag"; flag: string; value: FlagValue }
  | { type: "add_item"; item: string }
  | { type: "remove_item"; item: string }
  | { type: "change_room"; room: string }
  | { type: "complete_game" }
  | { type: "display_message"; text: string };

export interface CameraDefinition {
  image: string;
  description: string;
  /** Alternative descriptions; the first whose conditions all hold replaces `description`. */
  variants?: { when: Condition[]; description: string }[];
}

/** A brightness rule: when all conditions hold, the room is shown at `brightness`. */
export interface LightingRule {
  when: Condition[];
  brightness: number;
}

/**
 * One step of a room's hint ladder. When every `skipIf` condition holds (the
 * step it helps with is already done), the hint is passed over.
 */
export interface Hint {
  text: string;
  skipIf?: Condition[];
}

export const MAX_HINTS = 5;

const MINUTE = 60_000;
/**
 * When each hint unlocks, counted from the start of the level: the 1st after
 * 10 minutes, the 2nd after 30, then 1h30, 3h and 6h.
 */
export const HINT_UNLOCK_MS = [10 * MINUTE, 30 * MINUTE, 90 * MINUTE, 180 * MINUTE, 360 * MINUTE];

export interface ObjectDefinition {
  name: string;
  aliases?: string[];
  /** Cameras from which this object can be interacted with. */
  cameras: CameraId[];
}

export interface ItemDefinition {
  name: string;
  aliases?: string[];
  description?: string;
}

/**
 * One rule: the exact phrase that triggers it. Each word of `say` is an id
 * (global word, object, item or room verb) or a literal such as a code. Rules
 * are tried in file order; the first whose phrase matches and whose
 * conditions all hold is applied.
 *
 * ["clock"] looks at the clock, ["open", "drawer"] opens it,
 * ["brass_key", "door"] uses the key on the door, ["0315", "drawer"] enters
 * a code. The last word is the target: it must be visible from the current
 * camera (or be a carried item), and every item word must be carried.
 */
export interface Interaction {
  say: string[];
  conditions?: Condition[];
  effects: Effect[];
}

/** A room-specific word (e.g. "pour", "pray"), usable in that room's phrases. */
export interface VerbDefinition {
  name: string;
  aliases?: string[];
}

/** A room is one level of the game. */
export interface RoomDefinition {
  id: string;
  title: string;
  cameras: Record<CameraId, CameraDefinition>;
  objects: Record<string, ObjectDefinition>;
  items: Record<string, ItemDefinition>;
  /** Room-specific words; must not clash with any other word of the room or a global word. */
  verbs?: Record<string, VerbDefinition>;
  initialFlags?: Record<string, FlagValue>;
  interactions: Interaction[];
  /** Up to MAX_HINTS hints, from vaguest to most explicit. */
  hints?: Hint[];
  /**
   * How bright the camera images are drawn (1 = as painted, 0.5 = half as
   * bright). `lighting` rules are checked in order and the first that holds
   * wins, so e.g. a dark room can light up once a flag is set.
   */
  brightness?: number;
  lighting?: LightingRule[];
}

/** Several rooms played as levels, in the order listed by rooms/game.json. */
export interface GameDefinition {
  title: string;
  /** Room ids in level order; the first one is where the game starts. */
  order: string[];
  rooms: Record<string, RoomDefinition>;
}

// ---------------------------------------------------------------------------
// Events (engine output)
// ---------------------------------------------------------------------------

/**
 * Failure reasons. unknown_object and not_visible get explicit messages; all
 * others show only the generic "Nothing happens." / "Nothing special.".
 */
export type FailureReason =
  | "unknown_object"
  | "not_visible"
  | "item_not_held"
  | "no_interaction"
  | "conditions_unmet";

export type GameEvent =
  | { type: "message"; text: string }
  | { type: "camera_changed"; camera: CameraId; text: string }
  | { type: "item_added"; item: string; text: string }
  | { type: "item_removed"; item: string; text: string }
  | { type: "inventory"; items: string[]; text: string }
  | { type: "flag_set"; flag: string; value: FlagValue }
  | { type: "room_changed"; room: string }
  | { type: "room_entered"; room: string; text: string }
  | { type: "game_completed"; text: string }
  | { type: "hint_revealed"; hint: number; text: string }
  /** The next hint isn't unlocked yet; `availableAt` is on the host clock, for a live countdown. */
  | { type: "hint_locked"; availableAt: number; text: string }
  | { type: "failure"; reason: FailureReason; text: string };

export interface StepResult {
  state: GameState;
  events: GameEvent[];
}
