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
    const faltando = [];
    for (const [nome, modelo] of [
      ["User", "user"],
      ["Message", "message"],
      ["Order", "order"],
      ["Command", "command"],
      ["DownloadFile", "downloadFile"],
      ["Setting", "setting"],
    ]) {
      try {
        await prisma[modelo].count();
      } catch (err) {
        faltando.push(nome);
      }
    }
    checks.tabelas = faltando.length
      ? `faltam: ${faltando.join(", ")}`
      : "ok";
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

  // Dicas específicas para cada item que falhou — é só seguir a lista.
  const dicas = [];

  if (checks.JWT_SECRET !== "ok") {
    dicas.push(
      "Falta JWT_SECRET. Na Vercel: Settings → Environment Variables → add " +
        "JWT_SECRET (gere com `openssl rand -base64 48`), marque Production/Preview/Development e faça um Redeploy."
    );
  } else if (checks.sessao !== "ok") {
    dicas.push(
      "A sessão falhou: confira se JWT_SECRET foi salvo sem espaços/aspas extras e faça um Redeploy."
    );
  }

  if (checks.DATABASE_URL !== "ok" && !demo) {
    dicas.push(
      'Falta DATABASE_URL. Na Vercel: Settings → Environment Variables → add DATABASE_URL ' +
        'com a connection string do Neon/Supabase terminando em ?sslmode=require.'
    );
  }

  if (checks.conexao !== "ok") {
    dicas.push(
      "A conexão com o banco falhou: confira usuário/senha/host e o ?sslmode=require na DATABASE_URL."
    );
  }

  if (checks.tabelas !== "ok") {
    dicas.push(
      `Tabelas pendentes (${checks.tabelas}). Rode \`npx prisma db push\` apontando para ` +
        "esse banco (ou cole o SQL de prisma/schema.sql no SQL Editor do Neon/Supabase) e faça um Redeploy."
    );
  }

  if (dicas.length) {
    dicas.push(
      "Depois de mudar Environment Variables na Vercel é OBRIGATÓRIO fazer um Redeploy " +
        "(Deployments → ⋯ → Redeploy), senão o deploy antigo continua rodando."
    );
  }

  return NextResponse.json(
    {
      ok,
      ambiente: process.env.NODE_ENV || "development",
      modo: demo ? "demonstração (banco em memória)" : "normal",
      checks,
      dicas,
    },
    { status: ok ? 200 : 503 }
  );
}
