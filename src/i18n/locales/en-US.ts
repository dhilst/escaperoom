import type { Language } from "../language";

export const enUS: Language = {
  locale: "en-US",
  name: "English (US)",
  parser: {
    words: {
      look: "look",
      turn: "turn",
      open: "open",
      inventory: "inventory",
      help: "help",
      // Hidden: not listed in help.
      hint: "hint",
    },
    empty: "Type a command.",
  },
  engine: {
    nothingSpecial: "Nothing special.",
    nothingHappens: "Nothing happens.",
    turned: "You turn to face the other side of the room.",
    emptyInventory: "You are carrying nothing.",
    itemAdded: (name) => `[${name} added to inventory]`,
    itemRemoved: (name) => `[${name} removed from inventory]`,
    noSuchObject: (typed) => `There is no such ${typed}.`,
    notVisible: (typed) => `You don't see any ${typed} here.`,
    help: "Name something to look at it: clock. Combine what you carry with what you see: key door. Also: open <thing> · turn · look · inventory",
    hint: (n, total, text) => `Hint ${n}/${total}: ${text}`,
    hintLocked: (countdown) => `Next hint available in ${countdown}`,
    noMoreHints: "There are no more hints for this room.",
    escaped: "You escaped!",
    alreadyEscaped: "You have already escaped. Reload the page to play again.",
  },
  ui: {
    items: "Items",
    hints: "Hint",
    level: (n, total) => `Level ${n}/${total}`,
    placeholder: "type a command…",
    banner: "You escaped",
    bannerSub: "The end · reload the page to play again",
    helpTip: "Type help for the list of commands.",
    language: "Language",
  },
};
