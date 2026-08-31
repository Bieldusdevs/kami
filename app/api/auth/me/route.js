/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { errorResponse } from "@/lib/apiErrors";
import { applyOwnerBootstrap } from "@/lib/apiAuth";
import { normalizeRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = getSessionUserId();
    if (!userId) return NextResponse.json({ user: null });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ user: null });

    const finalUser = await applyOwnerBootstrap(user);

    return NextResponse.json({
      user: { ...finalUser, role: normalizeRole(finalUser.role) },
    });
  } catch (err) {
    // Falha aqui não deve derrubar a página: devolvemos "deslogado" e
    // registramos o motivo no log do servidor.
    const { json } = errorResponse(err, "GET /api/auth/me");
    return NextResponse.json({ user: null, error: json.error });
  }
}
