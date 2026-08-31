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
import { orderStatusSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const userId = getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "É preciso estar logado." }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const requester = await prisma.user.findUnique({ where: { id: userId } });
  const isOwner = order.userId === userId;
  const isAdmin = requester?.role === "Admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "Só quem criou o pedido (ou um admin) pode alterá-lo." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
    include: { user: { select: { username: true, id: true } } },
  });

  return NextResponse.json({
    order: {
      id: updated.id,
      game: updated.game,
      item: updated.item,
      qty: updated.qty,
      notes: updated.notes,
      status: updated.status,
      createdAt: updated.createdAt,
      username: updated.user.username,
      ownerId: updated.user.id,
    },
  });
}
