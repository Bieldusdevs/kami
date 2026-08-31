/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Painel: mudar status de um pedido de farm ou apagá-lo.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validation";
import { requireStaff } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Status inválido.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: { user: { select: { id: true, username: true } } },
    });

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        item: order.item,
        username: order.user.username,
      },
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Pedido não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const { status, json } = errorResponse(err, "PATCH /api/admin/orders/[id]");
    return NextResponse.json(json, { status });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    await prisma.order.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Pedido não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const { status, json } = errorResponse(err, "DELETE /api/admin/orders/[id]");
    return NextResponse.json(json, { status });
  }
}
