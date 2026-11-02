import { enUS } from "../i18n/locales/en-US";
import { phraseKey } from "./parser";
import type { GameDefinition, ParserLanguage, RoomDefinition } from "./types";

export class RoomValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid room definition:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.name = "RoomValidationError";
  }
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isFlagValue = (v: unknown) => ["boolean", "string", "number"].includes(typeof v);
const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

const CAMERAS = ["A", "C"];
const VERBS = ["inspect", "open", "use"];

/**
 * Check untrusted JSON against the room schema and cross-references.
 * Returns the data typed as a RoomDefinition, or throws listing every problem found.
 */
export function validateRoom(data: unknown, language: ParserLanguage = enUS.parser): RoomDefinition {
  const problems: string[] = [];
  const err = (msg: string) => problems.push(msg);

  if (!isObj(data)) throw new RoomValidationError(["room must be a JSON object"]);

  if (!isStr(data.id)) err("id must be a non-empty string");
  if (!isStr(data.title)) err("title must be a non-empty string");

  if (!isObj(data.cameras)) {
    err("cameras must be an object with keys A and C");
  } else {
    for (const cam of CAMERAS) {
      const def = data.cameras[cam];
      if (!isObj(def)) err(`cameras.${cam} is missing`);
      else {
        if (!isStr(def.image)) err(`cameras.${cam}.image must be a non-empty string`);
        if (!isStr(def.description)) err(`cameras.${cam}.description must be a non-empty string`);
      }
    }
  }

  const objects = isObj(data.objects) ? data.objects : (err("objects must be an object"), {});
  const items = isObj(data.items) ? data.items : (err("items must be an object"), {});

  const aliasOwner = new Map<string, string>();
  const checkNamed = (kind: string, id: string, def: unknown) => {
    const where = `${kind}.${id}`;
    if (!isObj(def)) return err(`${where} must be an object`);
    if (!isStr(def.name)) err(`${where}.name must be a non-empty string`);
    if (def.aliases !== undefined && !isStrArray(def.aliases)) err(`${where}.aliases must be an array of strings`);
    const names = [id, id.replace(/_/g, " "), def.name, ...(isStrArray(def.aliases) ? def.aliases : [])];
    for (const raw of names) {
      if (typeof raw !== "string") continue;
      // Compare names the way the parser will see them (case, accents and articles ignored).
      const name = phraseKey(raw, language);
      if (name === "") {
        err(`${where}: name "${raw}" is empty once articles and prepositions are ignored`);
        continue;
      }
      const owner = aliasOwner.get(name);
      if (owner !== undefined && owner !== id) err(`name "${name}" is used by both "${owner}" and "${id}"`);
      aliasOwner.set(name, id);
    }
  };

  for (const [id, def] of Object.entries(objects)) {
    checkNamed("objects", id, def);
    if (isObj(def)) {
      const cams = def.cameras;
      if (!Array.isArray(cams) || cams.length === 0 || !cams.every((c) => CAMERAS.includes(c as string))) {
        err(`objects.${id}.cameras must be a non-empty array of "A" and/or "C"`);
      }
    }
  }
  for (const [id, def] of Object.entries(items)) {
    checkNamed("items", id, def);
    if (isObj(def) && def.description !== undefined && !isStr(def.description)) {
      err(`items.${id}.description must be a string`);
    }
  }

  if (data.initialFlags !== undefined) {
    if (!isObj(data.initialFlags)) err("initialFlags must be an object");
    else
      for (const [flag, value] of Object.entries(data.initialFlags)) {
        if (!isFlagValue(value)) err(`initialFlags.${flag} must be a boolean, string or number`);
      }
  }

  if (!Array.isArray(data.interactions)) {
    err("interactions must be an array");
  } else {
    data.interactions.forEach((rule, i) => {
      const where = `interactions[${i}]`;
      if (!isObj(rule)) return err(`${where} must be an object`);
      if (!VERBS.includes(rule.verb as string)) err(`${where}.verb must be one of ${VERBS.join(", ")}`);
      if (!isStr(rule.object) || !(rule.object in objects)) err(`${where}.object "${rule.object}" is not a known object`);
      if (rule.verb === "use" && !isStr(rule.item)) err(`${where}.item is required for "use"`);
      if (rule.verb !== "use" && rule.item !== undefined) err(`${where}.item is only allowed for "use"`);

      if (rule.conditions !== undefined && !Array.isArray(rule.conditions)) err(`${where}.conditions must be an array`);
      (Array.isArray(rule.conditions) ? rule.conditions : []).forEach((c, j) => {
        const at = `${where}.conditions[${j}]`;
        if (!isObj(c)) return err(`${at} must be an object`);
        if (c.type === "flag_equals") {
          if (!isStr(c.flag)) err(`${at}.flag must be a non-empty string`);
          if (!isFlagValue(c.value)) err(`${at}.value must be a boolean, string or number`);
        } else if (c.type === "has_item") {
          if (!isStr(c.item) || !(c.item in items)) err(`${at}.item "${c.item}" is not a known item`);
        } else err(`${at}.type "${c.type}" is not a known condition`);
      });

      if (!Array.isArray(rule.effects)) return err(`${where}.effects must be an array`);
      rule.effects.forEach((e, j) => {
        const at = `${where}.effects[${j}]`;
        if (!isObj(e)) return err(`${at} must be an object`);
        switch (e.type) {
          case "set_flag":
            if (!isStr(e.flag)) err(`${at}.flag must be a non-empty string`);
            if (!isFlagValue(e.value)) err(`${at}.value must be a boolean, string or number`);
            break;
          case "add_item":
          case "remove_item":
            if (!isStr(e.item) || !(e.item in items)) err(`${at}.item "${e.item}" is not a known item`);
            break;
          case "change_room":
            if (!isStr(e.room)) err(`${at}.room must be a non-empty string`);
            break;
          case "display_message":
            if (!isStr(e.text)) err(`${at}.text must be a non-empty string`);
            break;
          case "complete_game":
            break;
          default:
            err(`${at}.type "${e.type}" is not a known effect`);
        }
      });
    });
  }

  if (problems.length > 0) throw new RoomValidationError(problems);
  return data as unknown as RoomDefinition;
}

/**
 * Validate a game manifest ({ title, rooms: [ids in level order] }) together
 * with every room file. Also checks that each change_room points at a listed room.
 */
export function validateGame(
  manifest: unknown,
  roomData: unknown[],
  language: ParserLanguage = enUS.parser,
): GameDefinition {
  const problems: string[] = [];
  const rooms: Record<string, RoomDefinition> = {};

  for (const data of roomData) {
    try {
      const room = validateRoom(data, language);
      if (room.id in rooms) problems.push(`room id "${room.id}" is defined twice`);
      rooms[room.id] = room;
    } catch (e) {
      if (!(e instanceof RoomValidationError)) throw e;
      const id = isObj(data) && isStr(data.id) ? data.id : "?";
      problems.push(...e.problems.map((p) => `room "${id}": ${p}`));
    }
  }

  if (!isObj(manifest)) throw new RoomValidationError([...problems, "game manifest must be a JSON object"]);
  if (!isStr(manifest.title)) problems.push("game title must be a non-empty string");
  const order = isStrArray(manifest.rooms) && manifest.rooms.length > 0 ? manifest.rooms : [];
  if (order.length === 0) problems.push("game rooms must be a non-empty array of room ids");
  for (const id of order) if (!(id in rooms) && problems.every((p) => !p.startsWith(`room "${id}"`))) {
    problems.push(`game lists room "${id}" but no such room exists`);
  }

  for (const room of Object.values(rooms)) {
    room.interactions.forEach((rule, i) => {
      for (const effect of rule.effects) {
        if (effect.type === "change_room" && !order.includes(effect.room)) {
          problems.push(`room "${room.id}": interactions[${i}] changes to room "${effect.room}", which the game does not list`);
        }
      }
    });
  }

  if (problems.length > 0) throw new RoomValidationError(problems);
  return { title: manifest.title as string, order, rooms };
}
