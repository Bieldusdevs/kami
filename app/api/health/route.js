/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Diagnóstico: abra /api/health para ver rapidamente o que está faltando
// (variáveis de ambiente, conexão com o banco, tabelas criadas).
// Se quiser proteger o endpoint, defina HEALTH_TOKEN e acesse /api/health?t=SEU_TOKEN
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = process.env.HEALTH_TOKEN;
  if (token) {
    const given = req.nextUrl?.searchParams?.get("t");
    if (given !== token) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const checks = {};

  const demo = process.env.KAMI_DEMO_DB === "1";

  // 1. Variáveis de ambiente (só dizemos se estão presentes, nunca o valor).
  checks.DATABASE_URL = process.env.DATABASE_URL
    ? "ok"
    : demo
    ? "ausente (rodando em modo demonstração com banco em memória)"
    : "ausente";
  checks.JWT_SECRET =
    process.env.NODE_ENV === "production"
      ? process.env.JWT_SECRET
        ? "ok"
        : "ausente"
      : process.env.JWT_SECRET
      ? "ok"
      : "ausente (usando segredo temporário de desenvolvimento)";

  // 2. Conexão com o banco.
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.conexao = "ok";
  } catch (err) {
    checks.conexao = `falhou: ${String(err?.message || err).slice(0, 200)}`;
  }

  // 3. Tabelas criadas (precisa de `npx prisma db push`).
  if (checks.conexao === "ok") {
    try {
      await prisma.user.count();
      checks.tabelas = "ok";
    } catch (err) {
      checks.tabelas = `falhou: ${String(err?.message || err).slice(0, 200)}`;
    }
  } else {
    checks.tabelas = "não verificado (sem conexão)";
  }

  // 4. Sessão (JWT).
  try {
    const probe = signSession({ sub: "healthcheck" });
    checks.sessao = verifySession(probe) ? "ok" : "falhou: token inválido";
  } catch (err) {
    checks.sessao = `falhou: ${String(err?.message || err).slice(0, 200)}`;
  }

  const ok =
    (checks.DATABASE_URL === "ok" || demo) &&
    checks.conexao === "ok" &&
    checks.tabelas === "ok" &&
    checks.sessao === "ok";

  return NextResponse.json(
    {
      ok,
      ambiente: process.env.NODE_ENV || "development",
      modo: demo ? "demonstração (banco em memória)" : "normal",
      checks,
      dicas: ok
        ? []
        : [
            "Crie um arquivo .env (ou configure as variáveis no painel da Vercel):",
            '  DATABASE_URL="postgresql://usuario:senha@host:5432/kamikaze?sslmode=require"',
            "  JWT_SECRET=\"cole um valor aleatório (openssl rand -base64 48)\"",
            "Depois rode `npx prisma db push` para criar as tabelas e reinicie o servidor.",
          ],
    },
    { status: ok ? 200 : 503 }
  );
}
