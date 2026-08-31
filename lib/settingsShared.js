/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Parte "pura" das configurações: valores padrão e helpers de formato.
// Este arquivo NÃO importa o Prisma para poder ser usado em componentes
// de cliente (navegador) sem levar o banco junto no bundle.

export const DEFAULT_GAMES = [
  "FiveM",
  "GTA V Online",
  "Valorant",
  "CS2",
  "League of Legends",
  "Genshin Impact",
  "World of Warcraft",
  "Outro",
];

// chave -> { padrao, tipo, label, dica }
export const SETTINGS_SCHEMA = {
  "site.announcement": {
    padrao: "",
    tipo: "texto",
    label: "Aviso no topo do site",
    dica: "Aparece em uma faixa no topo. Deixe vazio para esconder.",
    publico: true,
  },
  "site.heroSubtitle": {
    padrao:
      "A Kamikaze é uma equipe formada para dominar o farm, o ranking e a comunicação — tudo em um só lugar.",
    tipo: "texto",
    label: "Texto de abertura (hero)",
    dica: "O parágrafo principal da primeira tela.",
    publico: true,
  },
  "site.discord": {
    padrao: "",
    tipo: "url",
    label: "Link do Discord",
    dica: "Botão do Discord no topo e no rodapé. Vazio = botão escondido.",
    publico: true,
  },
  "farm.games": {
    padrao: JSON.stringify(DEFAULT_GAMES),
    tipo: "lista",
    label: "Jogos disponíveis para farm",
    dica: "Um jogo por linha. É a lista que aparece no formulário de entrega.",
    publico: true,
  },
  "farm.notice": {
    padrao: "",
    tipo: "texto",
    label: "Recado na seção de farm",
    dica: "Ex.: prazos, regras de entrega. Vazio = não mostra nada.",
    publico: true,
  },
  "arquivos.notice": {
    padrao: "Baixe com atenção: substitua sempre a pasta citizen inteira.",
    tipo: "texto",
    label: "Recado na página de arquivos",
    dica: "Instrução que aparece para os membros na área de downloads.",
    publico: true,
  },
  "comandos.notice": {
    padrao: "",
    tipo: "texto",
    label: "Recado na página de comandos",
    dica: "Ex.: prefixo usado no chat. Vazio = não mostra nada.",
    publico: true,
  },
};

export function defaultSettings() {
  const out = {};
  for (const [key, meta] of Object.entries(SETTINGS_SCHEMA)) out[key] = meta.padrao;
  return out;
}

export function parseGames(value) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // cai para o formato "um por linha"
  }
  return String(value || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function serializeGames(list) {
  return JSON.stringify(list.map((g) => String(g).trim()).filter(Boolean));
}
