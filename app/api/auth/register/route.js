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
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const ip = getClientIp(req);
  const limited = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um minuto e tente novamente." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
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
      { error: `Esse ${field} já está em uso.` },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      usernameLower,
      email: emailLower,
      passwordHash,
    },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  setSessionCookie(user.id);

  return NextResponse.json({ user }, { status: 201 });
}
