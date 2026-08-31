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
import { messageSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "asc" },
    take: 60,
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      username: m.user.username,
    })),
  });
}

export async function POST(req) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "É preciso estar logado." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limited = rateLimit(`chat:${userId}:${ip}`, { limit: 20, windowMs: 30_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Você está enviando mensagens rápido demais." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Mensagem inválida." },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: { text: parsed.data.text, userId },
    include: { user: { select: { username: true } } },
  });

  return NextResponse.json(
    {
      message: {
        id: message.id,
        text: message.text,
        createdAt: message.createdAt,
        username: message.user.username,
      },
    },
    { status: 201 }
  );
}
