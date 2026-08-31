/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Tradução de erros internos (Prisma, configuração) em respostas JSON com
// mensagem útil. Antes, qualquer falha de banco virava um 500 sem corpo e o
// front-end quebrava ao tentar fazer o parse — era aquele "erro" sem fim
// na hora de entrar / cadastrar.

// Erro de configuração do servidor (variável de ambiente ausente, etc.).
export class ConfigError extends Error {
  constructor(message, code = "CONFIG") {
    super(message);
    this.name = "ConfigError";
    this.code = code;
  }
}

// Códigos do Prisma que significam "o banco não respondeu / não está pronto".
const PRISMA_UNAVAILABLE = new Set([
  "P1000", // falha de autenticação
  "P1001", // servidor inacessível
  "P1002", // timeout conectando
  "P1003", // banco não existe
  "P1004", // uncertain
  "P1008", // operação expirou
  "P1009", // já existe
  "P1010", // acesso negado
  "P1011", // TLS
  "P1012", // erro de TLS
  "P1013", // senha incorreta
  "P1014", // modelo inválido
  "P1015", // versão não suportada
  "P1016", // parâmetro incorreto
  "P1017", // conexão fechada
  "P2024", // sem conexão no pool
]);

// Códigos que significam "o banco existe, mas o schema não foi criado".
const PRISMA_SCHEMA_MISSING = new Set([
  "P2021", // tabela não existe
  "P2022", // coluna não existe
  "P2033", // tipo numérico fora do range (schema antigo)
]);

export function isPrismaError(err) {
  if (!err || typeof err !== "object") return false;
  if (typeof err.code === "string" && /^P\d{3,4}$/.test(err.code)) return true;
  const name = err.constructor?.name || err.name || "";
  return String(name).startsWith("Prisma");
}

// Um erro de "variável de ambiente ausente" do Prisma (DATABASE_URL) chega
// como erro de inicialização do client, com essa mensagem.
function isMissingEnvError(err) {
  const msg = String(err?.message || "");
  return (
    msg.includes("Environment variable not found") ||
    msg.includes("DATABASE_URL") ||
    (String(err?.name || "").includes("PrismaClientInitializationError") &&
      msg.toLowerCase().includes("environment"))
  );
}

// Prisma Client sem generate (ou sem engine): acontece quando o deploy não
// rodou `prisma generate` / `npm install` direito.
function isNotGeneratedError(err) {
  const msg = String(err?.message || "");
  return (
    msg.includes("did not initialize yet") ||
    msg.includes("prisma generate") ||
    msg.includes("PrismaClientInitializationError")
  );
}

export function isUniqueViolation(err) {
  return err?.code === "P2002";
}

// Converte um erro desconhecido em { status, error, code } prontos p/ JSON.
export function describeError(err) {
  if (err instanceof ConfigError) {
    return {
      status: 503,
      code: err.code,
      error:
        "O servidor não está configurado corretamente (faltam variáveis de ambiente).",
      detail: err.message,
    };
  }

  if (isMissingEnvError(err)) {
    return {
      status: 503,
      code: "DB_NOT_CONFIGURED",
      error:
        "Banco de dados não configurado no servidor (DATABASE_URL ausente ou inválida).",
      detail: err?.message ? String(err.message) : String(err),
    };
  }

  if (isNotGeneratedError(err)) {
    return {
      status: 503,
      code: "DB_NOT_GENERATED",
      error:
        "O cliente do banco não está pronto neste servidor (rode `npx prisma generate` e confira a DATABASE_URL).",
      detail: err?.message ? String(err.message) : String(err),
    };
  }

  if (isPrismaError(err)) {
    if (isUniqueViolation(err)) {
      return {
        status: 409,
        code: "ALREADY_EXISTS",
        error: "Esse usuário ou e-mail já está em uso.",
        detail: err.message,
      };
    }
    if (PRISMA_SCHEMA_MISSING.has(err.code)) {
      return {
        status: 503,
        code: "DB_SCHEMA_MISSING",
        error:
          "As tabelas do banco não existem. Rode `npx prisma db push` (ou `npm run db:push`) uma vez para criá-las.",
        detail: err.message,
      };
    }
    if (PRISMA_UNAVAILABLE.has(err.code)) {
      return {
        status: 503,
        code: "DB_UNAVAILABLE",
        error:
          "Não foi possível falar com o banco de dados agora. Tente novamente em instantes.",
        detail: err.message,
      };
    }
    return {
      status: 500,
      code: err.code || "DB_ERROR",
      error: "Falha no banco de dados. Tente novamente.",
      detail: err.message,
    };
  }

  if (isMissingEnvError(err)) {
    return {
      status: 503,
      code: "DB_NOT_CONFIGURED",
      error:
        "Banco de dados não configurado no servidor (DATABASE_URL ausente ou inválida).",
      detail: err.message,
    };
  }

  return {
    status: 500,
    code: "INTERNAL",
    error: "Erro interno do servidor. Tente novamente.",
    detail: err?.message ? String(err.message) : String(err),
  };
}

// Uso dentro das rotas:
//   } catch (err) { return errorResponse(err, "POST /api/auth/login"); }
export function errorResponse(err, label = "rota") {
  const info = describeError(err);
  // Detalhe técnico só no log do servidor — nunca vai para o navegador.
  console.error(`[kamikaze] erro em ${label} [${info.code}]:`, info.detail || err);
  return { status: info.status, json: { error: info.error, code: info.code } };
}
