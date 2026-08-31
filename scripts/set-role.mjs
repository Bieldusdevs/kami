#!/usr/bin/env node
/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 *
 * Muda o cargo de um membro pelo terminal (útil se você ficar sem Dono).
 *
 *   npm run set-role -- novak Dono
 *   npm run set-role -- ana Gerente
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROLES = ["Dono", "Subdono", "Gerente", "Membro"];

// carrega .env / .env.local sem dependência externa
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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const [username, role] = process.argv.slice(2);

if (!username || !role) {
  console.log("Uso: npm run set-role -- <usuario> <Dono|Subdono|Gerente|Membro>");
  process.exit(1);
}

const cargo = ROLES.find((r) => r.toLowerCase() === role.toLowerCase());
if (!cargo) {
  console.log(`Cargo inválido "${role}". Use um destes: ${ROLES.join(", ")}`);
  process.exit(1);
}

let PrismaClient;
try {
  ({ PrismaClient } = await import("@prisma/client"));
} catch (err) {
  console.log("Não foi possível carregar o Prisma Client. Rode: npx prisma generate");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({
    where: { usernameLower: username.toLowerCase() },
    data: { role: cargo },
    select: { id: true, username: true, role: true },
  });
  console.log(`✔ ${user.username} agora é ${user.role}.`);
} catch (err) {
  if (err?.code === "P2025") {
    console.log(`✖ Não achei ninguém com o usuário "${username}".`);
  } else {
    console.log("✖ Erro:", String(err.message).split("\n")[0]);
    console.log("Confira a DATABASE_URL (rode: npm run check).");
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect().catch(() => {});
}
