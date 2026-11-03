import type { Language } from "../language";

export const ptBR: Language = {
  locale: "pt-BR",
  name: "Português (Brasil)",
  parser: {
    words: {
      olhar: "look",
      virar: "turn",
      abrir: "open",
      inventário: "inventory",
      ajuda: "help",
      // Oculto: fora da ajuda.
      dica: "hint",
    },
    empty: "Digite um comando.",
  },
  engine: {
    nothingSpecial: "Nada de especial.",
    nothingHappens: "Nada acontece.",
    turned: "Você se vira para o outro lado do cômodo.",
    emptyInventory: "Você não está carregando nada.",
    itemAdded: (name) => `[Adicionado ao inventário: ${name}]`,
    itemRemoved: (name) => `[Removido do inventário: ${name}]`,
    noSuchObject: (typed) => `Não há "${typed}" aqui.`,
    notVisible: (typed) => `Daqui você não vê "${typed}".`,
    help: "Diga o nome de algo para olhá-lo: relógio. Combine o que você carrega com o que vê: chave porta. Também: abrir <coisa> · virar · olhar · inventário",
    hint: (n, total, text) => `Dica ${n}/${total}: ${text}`,
    hintLocked: (countdown) => `Próxima dica disponível em ${countdown}`,
    noMoreHints: "Não há mais dicas para esta sala.",
    escaped: "Você escapou!",
    alreadyEscaped: "Você já escapou. Recarregue a página para jogar de novo.",
  },
  ui: {
    items: "Itens",
    hints: "Dica",
    level: (n, total) => `Fase ${n}/${total}`,
    placeholder: "digite um comando…",
    banner: "Você escapou",
    bannerSub: "Fim · recarregue a página para jogar de novo",
    helpTip: "Digite ajuda para ver os comandos.",
    progressRestored: "Seu progresso foi restaurado.",
    language: "Idioma",
  },
};
