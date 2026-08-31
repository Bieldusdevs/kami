/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fileSchema, zodMessage } from "@/lib/validation";
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

    const parsed = fileSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodMessage(parsed.error, "Dados inválidos."), code: "VALIDATION" },
        { status: 400 }
      );
    }

    const file = await prisma.downloadFile.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ file });
  } catch (err) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Arquivo não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const { status, json } = errorResponse(err, "PATCH /api/files/[id]");
    return NextResponse.json(json, { status });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    await prisma.downloadFile.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Arquivo não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    const { status, json } = errorResponse(err, "DELETE /api/files/[id]");
    return NextResponse.json(json, { status });
  }
}
