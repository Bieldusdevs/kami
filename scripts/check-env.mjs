#!/usr/bin/env node
/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 *
 * Diagnóstico rápido: `npm run check`
 * Mostra exatamente o que falta para login/cadastro funcionarem.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const C = {
  reset: "[0m",
  red: "[31m",
  green: "[32m",
  yellow: "[33m",
  dim: "[2m",
  bold: "[1m",
};

function say(kind, msg) {
  const marks = { ok: `${C.green}✔${C.reset}`, bad: `${C.red}✖${C.reset}`, warn: `${C.yellow}!${C.reset}`, info: `${C.dim}·${C.reset}` };
  console.log(`${marks[kind] || marks.info} ${msg}`);
}

// Carrega .env / .env.local sem dependências extras.
function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    for (const rawLine of fs.readFileSync(full, "utf8").split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    say("info", `carregado ${file}`);
  }
}

let problems = 0;

loadEnvFiles();

console.log(`\n${C.bold}KAMIKAZE 神風 — verificação de ambiente${C.reset}\n`);

// 1. DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const masked = dbUrl.replace(/\/\/([^:/@]+):([^@]+)@/, "//$1:***@");
  say("ok", `DATABASE_URL definida ${C.dim}(${masked})${C.reset}`);
  if (!dbUrl.includes("sslmode=require") && !/localhost|127\.0\.0\.1/.test(dbUrl)) {
    say("warn", "Sem `?sslmode=require` — Neon/Supabase/Vercel Postgres costumam exigir SSL.");
  }
} else if (process.env.KAMI_DEMO_DB === "1") {
  say("info", "DATABASE_URL ausente, mas KAMI_DEMO_DB=1: usando banco em memória (só demonstração).");
} else {
  say("bad", "DATABASE_URL NÃO está definida — login e cadastro vão falhar.");
  say("info", "Crie um .env a partir do .env.example: cp .env.example .env");
  problems += 1;
}

// 2. JWT_SECRET
const secret = process.env.JWT_SECRET;
if (secret && secret.trim()) {
  const strong = secret.trim().length >= 32;
  say(strong ? "ok" : "warn", `JWT_SECRET definida (${secret.trim().length} caracteres)${strong ? "" : " — recomenda-se 48+ caracteres"}`);
  if (!strong) say("info", "Gere uma forte: openssl rand -base64 48");
} else if (process.env.NODE_ENV === "production") {
  say("bad", "JWT_SECRET NÃO está definida — em produção a sessão não funciona.");
  problems += 1;
} else {
  say("warn", "JWT_SECRET ausente (em desenvolvimento usa-se um segredo temporário).");
}

// 3. Prisma Client gerado
const clientPath = path.join(root, "node_modules", ".prisma", "client");
if (!fs.existsSync(clientPath)) {
  say("bad", "Prisma Client não gerado. Rode: npx prisma generate");
  problems += 1;
} else {
  say("ok", "Prisma Client gerado");
}

// 4. Conexão + tabelas
if (dbUrl) {
  let PrismaClient;
  try {
    ({ PrismaClient } = await import("@prisma/client"));
  } catch (err) {
    say("bad", `Não foi possível carregar o Prisma Client: ${err.message}`);
    problems += 1;
  }

  if (PrismaClient) {
    const prisma = new PrismaClient();
    try {
      await prisma.$connect();
      say("ok", "Conexão com o banco estabelecida");
      try {
        const total = await prisma.user.count();
        say("ok", `Tabelas prontas (${total} usuário(s) cadastrado(s))`);
      } catch (err) {
        say("bad", "As tabelas não existem no banco.");
        say("info", "Rode: npx prisma db push   (ou: npm run db:push)");
        say("info", `Detalhe: ${String(err.message).split("\n").slice(0, 3).join(" ")}`);
        problems += 1;
      }
    } catch (err) {
      say("bad", "Não foi possível conectar ao banco de dados.");
      say("info", `Detalhe: ${String(err.message).split("\n")[0]}`);
      say("info", "Confira host, usuário, senha, SSL e se o IP da sua máquina/Vercel está liberado.");
      problems += 1;
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

console.log("");
if (problems === 0) {
  say("ok", `${C.bold}Tudo certo!${C.reset} Login e cadastro devem funcionar.`);
} else {
  say("bad", `${C.bold}${problems} problema(s) encontrado(s).${C.reset} Resolva e rode "npm run check" de novo.`);
  process.exitCode = 1;
}
console.log("");
