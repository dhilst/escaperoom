import type { Language } from "../language";

export const es: Language = {
  locale: "es",
  name: "Español",
  parser: {
    verbs: {
      mirar: "look",
      girar: "turn",
      examinar: "inspect",
      inspeccionar: "inspect",
      abrir: "open",
      usar: "use",
      inventario: "inventory",
    },
    stopwords: [
      "el", "la", "los", "las", "un", "una", "unos", "unas",
      "de", "del", "en", "con", "a", "al", "para", "sobre",
    ],
    empty: "Escribe un comando.",
    unknown: (word) => `Comando desconocido "${word}". Prueba: mirar, girar, examinar, abrir, usar, inventario.`,
    usage: {
      look: "Uso: mirar",
      turn: "Uso: girar",
      inventory: "Uso: inventario",
      inspect: "Uso: examinar <objeto>",
      open: "Uso: abrir <objeto>",
      use: "Uso: usar <objeto> <destino>",
    },
  },
  engine: {
    nothingSpecial: "Nada especial.",
    nothingHappens: "No pasa nada.",
    turned: "Te giras hacia el otro lado de la habitación.",
    emptyInventory: "No llevas nada.",
    itemAdded: (name) => `[Añadido al inventario: ${name}]`,
    itemRemoved: (name) => `[Retirado del inventario: ${name}]`,
    escaped: "¡Has escapado!",
    alreadyEscaped: "Ya has escapado. Reinicia para volver a jugar.",
  },
  ui: {
    restart: "Reiniciar",
    restartTitle: "Reiniciar este nivel",
    items: "Objetos",
    level: (n, total) => `Nivel ${n}/${total}`,
    placeholder: "escribe un comando…",
    banner: "Has escapado",
    language: "Idioma",
  },
};
