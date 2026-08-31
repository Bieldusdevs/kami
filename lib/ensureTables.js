/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { CREATE_TABLES_SQL } from "./schemaSql";

// Cria as tabelas se elas ainda não existirem (CREATE TABLE IF NOT EXISTS).
// Assim o site funciona mesmo que ninguém tenha rodado `prisma db push`:
// na primeira vez que o banco for usado, ele se arruma sozinho.
// Roda uma vez por instância e nunca derruba a requisição se falhar
// (ex.: usuário do banco sem permissão de DDL).

let pendente = null;

const TABELAS = ["User", "Message", "Order", "Command", "DownloadFile", "Setting"];

// Pergunta ao banco quais das nossas tabelas já existem. Custa uma consulta
// leve e evita rodar os DDLs em toda inicialização de instância.
async function tabelasQueExistem(client) {
  const nomes = TABELAS.map((t) => `'${t}'`).join(", ");
  const linhas = await client.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${nomes})`
  );
  return new Set((linhas || []).map((l) => l.table_name));
}

function statements() {
  return CREATE_TABLES_SQL
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function bootstrapTables(client) {
  if (pendente) return pendente;

  pendente = (async () => {
    try {
      const existentes = await tabelasQueExistem(client);
      if (TABELAS.every((t) => existentes.has(t))) return; // já está tudo pronto
    } catch (err) {
      // Sem permissão de leitura no information_schema? Tentamos criar mesmo assim.
      console.warn("[kamikaze] não consegui listar as tabelas:", err?.message || err);
    }

    for (const sql of statements()) {
      try {
        await client.$executeRawUnsafe(sql);
      } catch (err) {
        // Já existe, falta permissão, banco fora do ar... seguimos em frente:
        // as consultas vão falhar com um erro amigável se for o caso.
        console.warn("[kamikaze] bootstrap de tabelas:", err?.message || err);
      }
    }
  })().catch(() => {});

  return pendente;
}
