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
import { getSettings, saveSettings, SETTINGS_SCHEMA } from "@/lib/settings";
import { requireStaff } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Público: são só textos/links do site, nada sensível.
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ settings, schema: SETTINGS_SCHEMA });
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/settings");
    return NextResponse.json(json, { status });
  }
}

// Gerente+
export async function PUT(req) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const settings = await saveSettings(body);
    return NextResponse.json({ settings });
  } catch (err) {
    const { status, json } = errorResponse(err, "PUT /api/settings");
    return NextResponse.json(json, { status });
  }
}
