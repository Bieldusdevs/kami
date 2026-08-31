/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Cargos da equipe e o que cada um pode fazer.
//
//   Dono     — manda em tudo, inclusive promover/rebaixar cargos
//   Subdono  — tudo, menos mexer em cargos
//   Gerente  — pedidos de farm, comandos, arquivos e textos do site
//   Membro   — usa o site: pede farm, baixa arquivos, conversa no chat

export const ROLES = ["Dono", "Subdono", "Gerente", "Membro"];

export const DEFAULT_ROLE = "Membro";

export function normalizeRole(role) {
  if (!role || typeof role !== "string") return DEFAULT_ROLE;
  const found = ROLES.find((r) => r.toLowerCase() === role.trim().toLowerCase());
  // Aceita também o valor antigo "Admin" (era o cargo de moderador do código
  // original) tratando-o como Gerente.
  if (!found && role.trim().toLowerCase() === "admin") return "Gerente";
  return found || DEFAULT_ROLE;
}

export function isDono(role) {
  return normalizeRole(role) === "Dono";
}

// Gerente ou acima: pode cuidar de farm, comandos, arquivos e textos.
export function canManageContent(role) {
  return ["Dono", "Subdono", "Gerente"].includes(normalizeRole(role));
}

// Só o Dono mexe em cargos — é a ação mais perigosa do painel.
export function canManageRoles(role) {
  return isDono(role);
}

// Staff = qualquer cargo acima de Membro (mostra o botão "Painel").
export function isStaff(role) {
  return canManageContent(role);
}

export const ROLE_BADGE = {
  Dono: "text-[#ffd166] border-[#ffd16655]",
  Subdono: "text-[#c792ea] border-[#c792ea55]",
  Gerente: "text-blue-bright border-blue-bright",
  Membro: "text-muted border-lineStrong",
};
