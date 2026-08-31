/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Painel: lista completa de pedidos de farm (com filtro por status).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    const status = req.nextUrl?.searchParams?.get("status");
    const where = status && ["pendente", "andamento", "concluido"].includes(status)
      ? { status }
      : undefined;

    const orders = await prisma.order.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { user: { select: { id: true, username: true, role: true } } },
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
        updatedAt: o.updatedAt,
        username: o.user.username,
        ownerId: o.user.id,
        ownerRole: o.user.role,
      })),
    });
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/admin/orders");
    return NextResponse.json(json, { status });
  }
}
