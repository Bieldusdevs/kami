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
import { orderSchema, zodMessage } from "@/lib/validation";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOrder(o) {
  return {
    id: o.id,
    game: o.game,
    item: o.item,
    qty: o.qty,
    notes: o.notes,
    status: o.status,
    createdAt: o.createdAt,
    username: o.user.username,
    ownerId: o.user.id,
  };
}

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { username: true, id: true } } },
    });

    return NextResponse.json({ orders: orders.map(publicOrder) });
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/orders");
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
    const limited = rateLimit(`order:${userId}:${clientKey}`, { limit: 15, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitos pedidos em pouco tempo. Aguarde um pouco.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodMessage(parsed.error, "Dados inválidos."), code: "VALIDATION" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: { ...parsed.data, userId },
      include: { user: { select: { username: true, id: true } } },
    });

    return NextResponse.json({ order: publicOrder(order) }, { status: 201 });
  } catch (err) {
    const { status, json } = errorResponse(err, "POST /api/orders");
    return NextResponse.json(json, { status });
  }
}
