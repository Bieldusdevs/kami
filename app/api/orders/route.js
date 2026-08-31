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
import { orderSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { username: true, id: true } } },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      game: o.game,
      item: o.item,
      qty: o.qty,
      notes: o.notes,
      status: o.status,
      createdAt: o.createdAt,
      username: o.user.username,
      ownerId: o.user.id,
    })),
  });
}

export async function POST(req) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "É preciso estar logado." }, { status: 401 });
  }

  const ip = getClientIp(req);
  const limited = rateLimit(`order:${userId}:${ip}`, { limit: 15, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitos pedidos em pouco tempo. Aguarde um pouco." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dados inválidos." },
      { status: 400 }
    );
  }

  const order = await prisma.order.create({
    data: { ...parsed.data, userId },
    include: { user: { select: { username: true, id: true } } },
  });

  return NextResponse.json(
    {
      order: {
        id: order.id,
        game: order.game,
        item: order.item,
        qty: order.qty,
        notes: order.notes,
        status: order.status,
        createdAt: order.createdAt,
        username: order.user.username,
        ownerId: order.user.id,
      },
    },
    { status: 201 }
  );
}
