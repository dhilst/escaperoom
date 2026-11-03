import type { Language } from "../language";

export const es: Language = {
  locale: "es",
  name: "Español",
  parser: {
    words: {
      mirar: "look",
      girar: "turn",
      abrir: "open",
      inventario: "inventory",
      ayuda: "help",
      // Oculto: fuera de la ayuda.
      pista: "hint",
    },
    empty: "Escribe un comando.",
  },
  engine: {
    nothingSpecial: "Nada especial.",
    nothingHappens: "No pasa nada.",
    turned: "Te giras hacia el otro lado de la habitación.",
    emptyInventory: "No llevas nada.",
    itemAdded: (name) => `[Añadido al inventario: ${name}]`,
    itemRemoved: (name) => `[Retirado del inventario: ${name}]`,
    noSuchObject: (typed) => `Aquí no hay "${typed}".`,
    notVisible: (typed) => `Desde aquí no ves "${typed}".`,
    help: "Di el nombre de algo para mirarlo: reloj. Combina lo que llevas con lo que ves: llave puerta. También: abrir <cosa> · girar · mirar · inventario",
    hint: (n, total, text) => `Pista ${n}/${total}: ${text}`,
    hintLocked: (countdown) => `Próxima pista disponible en ${countdown}`,
    noMoreHints: "No hay más pistas para esta sala.",
    escaped: "¡Has escapado!",
    alreadyEscaped: "Ya has escapado. Recarga la página para volver a jugar.",
  },
  ui: {
    items: "Objetos",
    hints: "Pista",
    level: (n, total) => `Nivel ${n}/${total}`,
    placeholder: "escribe un comando…",
    banner: "Has escapado",
    bannerSub: "Fin · recarga la página para volver a jugar",
    helpTip: "Escribe ayuda para ver los comandos.",
    progressRestored: "Se restauró tu progreso.",
    language: "Idioma",
  },
};
