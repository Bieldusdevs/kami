/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Solicitações para entrar na equipe (recrutamento).
//   GET  — staff vê todas; membro logado vê apenas as próprias.
//   POST — membro logado envia uma solicitação (uma pendente por vez).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiAuth";
import { canManageContent } from "@/lib/roles";
import { applicationSchema, zodMessage } from "@/lib/validation";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { errorResponse } from "@/lib/apiErrors";
import { notifyDiscord } from "@/lib/discord";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicApplication(a) {
  return {
    id: a.id,
    discord: a.discord,
    motivation: a.motivation,
    proofUrl: a.proofUrl,
    status: a.status,
    decidedBy: a.decidedBy,
    decidedAt: a.decidedAt,
    createdAt: a.createdAt,
    username: a.user?.username,
    userId: a.user?.id,
  };
}

export async function GET() {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const where = canManageContent(user.role) ? {} : { userId: user.id };
    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { username: true, id: true } } },
    });

    return NextResponse.json({
      applications: applications.map(publicApplication),
      isStaff: canManageContent(user.role),
    });
  } catch (err) {
    const { status, json } = errorResponse(err, "GET /api/applications");
    return NextResponse.json(json, { status });
  }
}

export async function POST(req) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const clientKey = getClientKey(req);
    const limited = rateLimit(`application:${user.id}:${clientKey}`, { limit: 5, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitas solicitações em pouco tempo. Aguarde um minuto.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido.", code: "BAD_BODY" }, { status: 400 });
    }

    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: zodMessage(parsed.error, "Dados inválidos."), code: "VALIDATION" },
        { status: 400 }
      );
    }

    // Só uma solicitação pendente por pessoa — evita fila duplicada.
    const pending = await prisma.application.findFirst({
      where: { userId: user.id, status: "pendente" },
      select: { id: true },
    });
    if (pending) {
      return NextResponse.json(
        {
          error: "Você já tem uma solicitação pendente. Aguarde a gerência responder.",
          code: "ALREADY_PENDING",
        },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        discord: parsed.data.discord,
        motivation: parsed.data.motivation,
        proofUrl: parsed.data.proofUrl || null,
        userId: user.id,
      },
      include: { user: { select: { username: true, id: true } } },
    });

    // Avisa a gerência no Discord (silencioso se o webhook não estiver configurado).
    await notifyDiscord({
      title: "📥 Nova solicitação para entrar na equipe",
      description: `**${user.username}** quer entrar na Kamikaze.`,
      fields: [
        { name: "Discord", value: parsed.data.discord, inline: true },
        { name: "Motivação", value: parsed.data.motivation },
      ],
      footer: "Painel → Aprovações",
    });

    return NextResponse.json({ application: publicApplication(application) }, { status: 201 });
  } catch (err) {
    const { status, json } = errorResponse(err, "POST /api/applications");
    return NextResponse.json(json, { status });
  }
}
