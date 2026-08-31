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
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { errorResponse, isUniqueViolation } from "@/lib/apiErrors";
import { applyOwnerBootstrap } from "@/lib/apiAuth";
import { normalizeRole } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "POST /api/auth/register";

export async function POST(req) {
  try {
    const clientKey = getClientKey(req);
    const limited = rateLimit(`register:${clientKey}`, { limit: 5, windowMs: 60_000 });
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

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;
    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ usernameLower }, { email: emailLower }] },
      select: { id: true, usernameLower: true, email: true },
    });

    if (existing) {
      const field =
        existing.usernameLower === usernameLower ? "usuário" : "e-mail";
      return NextResponse.json(
        { error: `Esse ${field} já está em uso.`, code: "ALREADY_EXISTS" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          username,
          usernameLower,
          email: emailLower,
          passwordHash,
        },
        select: { id: true, username: true, role: true, createdAt: true },
      });
    } catch (err) {
      // Outra pessoa pode ter criado o mesmo usuário/e-mail entre a checagem
      // acima e o insert — o banco acusa P2002 e devolvemos 409 em vez de 500.
      if (isUniqueViolation(err)) {
        const target = Array.isArray(err?.meta?.target) ? err.meta.target : [];
        const field = target.some((t) => String(t).includes("mail"))
          ? "e-mail"
          : "usuário";
        return NextResponse.json(
          { error: `Esse ${field} já está em uso.`, code: "ALREADY_EXISTS" },
          { status: 409 }
        );
      }
      throw err;
    }

    // Se for o usuário definido em OWNER_USERNAME, já nasce Dono.
    const finalUser = await applyOwnerBootstrap({ ...user, usernameLower });

    setSessionCookie(finalUser.id, req);

    return NextResponse.json(
      {
        user: {
          id: finalUser.id,
          username: finalUser.username,
          role: normalizeRole(finalUser.role),
          createdAt: finalUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const { status, json } = errorResponse(err, ROUTE);
    return NextResponse.json(json, { status });
  }
}
