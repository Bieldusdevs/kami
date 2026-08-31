/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fileSchema } from "@/lib/validation";
import { requireUser, requireStaff } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Só membros logados veem os arquivos (citizen, mod som...).
export async function GET() {
  try {
    const { response } = await requireUser();
    if (response) return response;

    const files = await prisma.downloadFile.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ files });
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/files");
    return NextResponse.json(json, { status });
  }
}

export async function POST(req) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = fileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const file = await prisma.downloadFile.create({ data: parsed.data });
    return NextResponse.json({ file }, { status: 201 });
  } catch (err) {
    const { status, json } = errorResponse(err, "POST /api/files");
    return NextResponse.json(json, { status });
  }
}
