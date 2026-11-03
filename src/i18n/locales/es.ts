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
    help: "Cómo jugar: explora con palabras sueltas. Di el nombre de lo que ves para mirarlo (reloj) y lee cada descripción con atención: las palabras clave están ahí, sin resaltar para no arruinar la sorpresa. Piensa en la solución como frases dichas en el orden correcto. Cuando sepas lo suficiente, prueba frases más largas: crecen a medida que avanza el juego y rinden más. Evita las palabras de más: en vez de \"usar la llave en la puerta\", di \"llave puerta\". También: abrir <cosa> · girar · mirar · inventario",
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
