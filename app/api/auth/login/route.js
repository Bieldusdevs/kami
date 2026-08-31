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
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { errorResponse } from "@/lib/apiErrors";
import { applyOwnerBootstrap } from "@/lib/apiAuth";
import { normalizeRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Usuário ou senha incorretos.";
const ROUTE = "POST /api/auth/login";

export async function POST(req) {
  try {
    const clientKey = getClientKey(req);
    const limited = rateLimit(`login:${clientKey}`, { limit: 10, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde um minuto e tente novamente.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: GENERIC_ERROR, code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const login = parsed.data.username.toLowerCase();

    // Aceita tanto o usuário quanto o e-mail cadastrado no campo de login.
    const user = await prisma.user.findFirst({
      where: { OR: [{ usernameLower: login }, { email: login }] },
    });

    // Mensagem genérica proposital: não revela se o problema foi o usuário
    // ou a senha, para dificultar enumeração de contas.
    if (!user) {
      return NextResponse.json(
        { error: GENERIC_ERROR, code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: GENERIC_ERROR, code: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Se OWNER_USERNAME estiver definido no servidor, esse usuário é o Dono.
    const finalUser = await applyOwnerBootstrap(user);

    setSessionCookie(finalUser.id, req);

    return NextResponse.json({
      user: {
        id: finalUser.id,
        username: finalUser.username,
        role: normalizeRole(finalUser.role),
        createdAt: finalUser.createdAt,
      },
    });
  } catch (err) {
    const { status, json } = errorResponse(err, ROUTE);
    return NextResponse.json(json, { status });
  }
}
