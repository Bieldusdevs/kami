/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Painel: promover/rebaixar cargo. Só o Dono pode.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roleSchema } from "@/lib/validation";
import { requireDono } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const { user: dono, response } = await requireDono();
    if (response) return response;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = roleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Cargo inválido. Use: Dono, Subdono, Gerente ou Membro.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, username: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "Membro não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // O último Dono não pode se rebaixar — senão ninguém mais administra.
    if (target.id === dono.id && parsed.data.role !== "Dono") {
      const owners = await prisma.user.count({ where: { role: "Dono" } });
      if (owners <= 1) {
        return NextResponse.json(
          {
            error:
              "Você é o único Dono. Promova outro membro a Dono antes de mudar o seu cargo.",
            code: "LAST_OWNER",
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { role: parsed.data.role },
      select: { id: true, username: true, role: true },
    });

    return NextResponse.json({ member: updated });
  } catch (err) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Membro não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const { status, json } = errorResponse(err, "PATCH /api/admin/members/[id]");
    return NextResponse.json(json, { status });
  }
}
