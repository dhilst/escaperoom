import type {
  Condition,
  Effect,
  EngineMessages,
  GameEvent,
  GameState,
  RoomDefinition,
} from "./types";

export function checkCondition(state: GameState, condition: Condition): boolean {
  switch (condition.type) {
    case "flag_equals":
      return state.flags[condition.flag] === condition.value;
    case "has_item":
      return state.inventory.includes(condition.item);
  }
}

/** Apply one effect to `state` in place (the caller owns a fresh copy) and report what happened. */
export function applyEffect(
  state: GameState,
  effect: Effect,
  room: RoomDefinition,
  messages: EngineMessages,
): GameEvent[] {
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
      return [{ type: "item_added", item: effect.item, text: messages.itemAdded(name) }];
    }
    case "remove_item": {
      if (!state.inventory.includes(effect.item)) return [];
      state.inventory = state.inventory.filter((id) => id !== effect.item);
      const name = room.items[effect.item]?.name ?? effect.item;
      return [{ type: "item_removed", item: effect.item, text: messages.itemRemoved(name) }];
    }
    case "change_room":
      state.roomId = effect.room;
      state.camera = "A";
      return [{ type: "room_changed", room: effect.room }];
    case "complete_game":
      state.completed = true;
      return [{ type: "game_completed", text: messages.escaped }];
  }
}
