import type { Language } from "../language";

export const enUS: Language = {
  locale: "en-US",
  name: "English (US)",
  parser: {
    verbs: { look: "look", turn: "turn", inspect: "inspect", open: "open", use: "use", inventory: "inventory" },
    stopwords: ["the", "a", "an", "on", "in", "into", "with", "at", "to"],
    empty: "Type a command.",
    unknown: (word) => `Unknown command "${word}". Try: look, turn, inspect, open, use, inventory.`,
    usage: {
      look: "Usage: look",
      turn: "Usage: turn",
      inventory: "Usage: inventory",
      inspect: "Usage: inspect <object>",
      open: "Usage: open <object>",
      use: "Usage: use <item> <target>",
    },
  },
  engine: {
    nothingSpecial: "Nothing special.",
    nothingHappens: "Nothing happens.",
    turned: "You turn to face the other side of the room.",
    emptyInventory: "You are carrying nothing.",
    itemAdded: (name) => `[${name} added to inventory]`,
    itemRemoved: (name) => `[${name} removed from inventory]`,
    escaped: "You escaped!",
    alreadyEscaped: "You have already escaped. Restart to play again.",
  },
  ui: {
    restart: "Restart",
    restartTitle: "Restart this level",
    items: "Items",
    level: (n, total) => `Level ${n}/${total}`,
    placeholder: "type a command…",
    banner: "You escaped",
    language: "Language",
  },
};
