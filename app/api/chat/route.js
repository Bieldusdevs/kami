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
import { messageSchema, zodMessage } from "@/lib/validation";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/chat");
    return NextResponse.json(json, { status });
  }
}

export async function POST(req) {
  try {
    const userId = getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "É preciso estar logado." }, { status: 401 });
    }

    const clientKey = getClientKey(req);
    const limited = rateLimit(`chat:${userId}:${clientKey}`, { limit: 20, windowMs: 30_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Você está enviando mensagens rápido demais.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodMessage(parsed.error, "Mensagem inválida."), code: "VALIDATION" },
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
  } catch (err) {
    const { status, json } = errorResponse(err, "POST /api/chat");
    return NextResponse.json(json, { status });
  }
}
