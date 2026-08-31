/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Decisão da gerência sobre uma solicitação de entrada.
//   PATCH  — aprova/recusa ({ status: "aprovado" | "recusado" }). Só staff.
//   DELETE — apaga a solicitação. Só staff.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/apiAuth";
import { applicationStatusSchema, zodMessage } from "@/lib/validation";
import { errorResponse } from "@/lib/apiErrors";
import { notifyDiscord } from "@/lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const { user, response } = await requireStaff();
    if (response) return response;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = applicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodMessage(parsed.error, "Dados inválidos."), code: "VALIDATION" },
        { status: 400 }
      );
    }

    let application;
    try {
      application = await prisma.application.update({
        where: { id: params.id },
        data: { status: parsed.data.status, decidedBy: user.username, decidedAt: new Date() },
        include: { user: { select: { username: true, id: true } } },
      });
    } catch (err) {
      if (err?.code === "P2025") {
        return NextResponse.json({ error: "Solicitação não encontrada.", code: "NOT_FOUND" }, { status: 404 });
      }
      throw err;
    }

    const aprovado = parsed.data.status === "aprovado";
    await notifyDiscord({
      title: aprovado ? "✅ Solicitação aprovada" : "❌ Solicitação recusada",
      description: `**${application.user.username}** — decidido por **${user.username}**.`,
      color: aprovado ? 0x4fd6a8 : 0xff6b6b,
      fields: [{ name: "Discord", value: application.discord, inline: true }],
    });

    return NextResponse.json({
      application: {
        id: application.id,
        discord: application.discord,
        motivation: application.motivation,
        proofUrl: application.proofUrl,
        status: application.status,
        decidedBy: application.decidedBy,
        decidedAt: application.decidedAt,
        createdAt: application.createdAt,
        username: application.user.username,
        userId: application.user.id,
      },
    });
  } catch (err) {
    const { status, json } = errorResponse(err, "PATCH /api/applications/[id]");
    return NextResponse.json(json, { status });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    try {
      await prisma.application.delete({ where: { id: params.id } });
    } catch (err) {
      if (err?.code === "P2025") {
        return NextResponse.json({ error: "Solicitação não encontrada.", code: "NOT_FOUND" }, { status: 404 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { status, json } = errorResponse(err, "DELETE /api/applications/[id]");
    return NextResponse.json(json, { status });
  }
}
