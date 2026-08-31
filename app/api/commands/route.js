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
import { commandSchema, zodMessage } from "@/lib/validation";
import { requireStaff } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const commands = await prisma.command.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ commands });
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/commands");
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

    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodMessage(parsed.error, "Dados inválidos."), code: "VALIDATION" },
        { status: 400 }
      );
    }

    const command = await prisma.command.create({ data: parsed.data });
    return NextResponse.json({ command }, { status: 201 });
  } catch (err) {
    const { status, json } = errorResponse(err, "POST /api/commands");
    return NextResponse.json(json, { status });
  }
}
