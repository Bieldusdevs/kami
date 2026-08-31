/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Helpers de permissão para as rotas da API.
// Uso:
//   const auth = await requireStaff();
//   if (auth.response) return auth.response;   // 401/403 prontos
//   auth.user  -> usuário logado

import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSessionUserId } from "./auth";
import { canManageContent, canManageRoles, normalizeRole } from "./roles";

function json(status, error, code) {
  return NextResponse.json({ error, code }, { status });
}

async function loadUser() {
  const userId = getSessionUserId();
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, usernameLower: true, role: true, createdAt: true },
    });
    if (!user) return null;
    return { ...user, role: normalizeRole(user.role) };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await loadUser();
  if (!user) {
    return { user: null, response: json(401, "É preciso estar logado.", "UNAUTHENTICATED") };
  }
  return { user, response: null };
}

// Gerente, Subdono ou Dono.
export async function requireStaff() {
  const { user, response } = await requireUser();
  if (response) return { user: null, response };
  if (!canManageContent(user.role)) {
    return {
      user,
      response: json(403, "Só a gerência (Gerente/Subdono/Dono) pode fazer isso.", "FORBIDDEN"),
    };
  }
  return { user, response: null };
}

// Somente Dono — usado para mudar cargos.
export async function requireDono() {
  const { user, response } = await requireUser();
  if (response) return { user: null, response };
  if (!canManageRoles(user.role)) {
    return {
      user,
      response: json(403, "Só o Dono pode alterar cargos.", "FORBIDDEN"),
    };
  }
  return { user, response: null };
}

// Primeiro dono do time: se OWNER_USERNAME estiver definido no servidor,
// esse usuário vira Dono automaticamente ao entrar (basta fazer login de novo).
export async function applyOwnerBootstrap(user) {
  const ownerUsername = (process.env.OWNER_USERNAME || "").trim().toLowerCase();
  if (!ownerUsername) return user;
  if (user.usernameLower !== ownerUsername) return user;
  if (user.role === "Dono") return user;

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "Dono" },
      select: { id: true, username: true, usernameLower: true, role: true, createdAt: true },
    });
    return { ...updated, role: normalizeRole(updated.role) };
  } catch {
    return user;
  }
}
