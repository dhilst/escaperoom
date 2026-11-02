import type { Language } from "../language";

export const ptBR: Language = {
  locale: "pt-BR",
  name: "Português (Brasil)",
  parser: {
    verbs: {
      olhar: "look",
      virar: "turn",
      examinar: "inspect",
      inspecionar: "inspect",
      abrir: "open",
      usar: "use",
      inventário: "inventory",
    },
    stopwords: [
      "o", "a", "os", "as", "um", "uma", "uns", "umas",
      "de", "do", "da", "dos", "das", "no", "na", "nos", "nas", "em", "com", "para", "pra", "ao", "à",
    ],
    empty: "Digite um comando.",
    unknown: (word) => `Comando desconhecido "${word}". Tente: olhar, virar, examinar, abrir, usar, inventário.`,
    usage: {
      look: "Uso: olhar",
      turn: "Uso: virar",
      inventory: "Uso: inventário",
      inspect: "Uso: examinar <objeto>",
      open: "Uso: abrir <objeto>",
      use: "Uso: usar <item> <alvo>",
    },
  },
  engine: {
    nothingSpecial: "Nada de especial.",
    nothingHappens: "Nada acontece.",
    turned: "Você se vira para o outro lado do cômodo.",
    emptyInventory: "Você não está carregando nada.",
    itemAdded: (name) => `[Adicionado ao inventário: ${name}]`,
    itemRemoved: (name) => `[Removido do inventário: ${name}]`,
    escaped: "Você escapou!",
    alreadyEscaped: "Você já escapou. Reinicie para jogar de novo.",
  },
  ui: {
    restart: "Reiniciar",
    restartTitle: "Reiniciar esta fase",
    items: "Itens",
    level: (n, total) => `Fase ${n}/${total}`,
    placeholder: "digite um comando…",
    banner: "Você escapou",
    language: "Idioma",
  },
};
