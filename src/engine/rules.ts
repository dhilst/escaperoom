import type { Command, Condition, Effect, GameEvent, GameState, Interaction, RoomDefinition } from "./types";

export function checkCondition(state: GameState, condition: Condition): boolean {
  switch (condition.type) {
    case "flag_equals":
      return state.flags[condition.flag] === condition.value;
    case "has_item":
      return state.inventory.includes(condition.item);
  }
}

/** Apply one effect to `state` in place (the caller owns a fresh copy) and report what happened. */
export function applyEffect(state: GameState, effect: Effect, room: RoomDefinition): GameEvent[] {
  switch (effect.type) {
    case "display_message":
      return [{ type: "message", text: effect.text }];
    case "set_flag":
      state.flags[effect.flag] = effect.value;
      return [{ type: "flag_set", flag: effect.flag, value: effect.value }];
    case "add_item": {
      // Unique items: a second award is silently ignored.
      if (state.inventory.includes(effect.item)) return [];
      state.inventory.push(effect.item);
      const name = room.items[effect.item]?.name ?? effect.item;
      return [{ type: "item_added", item: effect.item, text: `[${name} added to inventory]` }];
    }
    case "remove_item": {
      if (!state.inventory.includes(effect.item)) return [];
      state.inventory = state.inventory.filter((id) => id !== effect.item);
      const name = room.items[effect.item]?.name ?? effect.item;
      return [{ type: "item_removed", item: effect.item, text: `[${name} removed from inventory]` }];
    }
    case "change_room":
      state.roomId = effect.room;
      state.camera = "A";
      return [{ type: "room_changed", room: effect.room }];
    case "complete_game":
      state.completed = true;
      return [{ type: "game_completed", text: "You escaped!" }];
  }
}

/** Rules whose verb and arguments match the command, regardless of conditions. */
export function matchingInteractions(room: RoomDefinition, command: Command): Interaction[] {
  return room.interactions.filter((rule) => {
    switch (command.verb) {
      case "inspect":
      case "open":
        return rule.verb === command.verb && rule.object === command.object;
      case "use":
        return rule.verb === "use" && rule.object === command.target && rule.item === command.item;
      default:
        return false;
    }
  });
}
