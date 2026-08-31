/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { PrismaClient } from "@prisma/client";
import { createMemoryClient } from "./prismaMemory";

// Evita criar múltiplas instâncias do Prisma Client durante hot-reload
// em desenvolvimento e em ambientes serverless da Vercel.
const globalForPrisma = globalThis;

// Quando a variável DATABASE_URL não existe (ou o Prisma Client não foi
// gerado), `new PrismaClient()` estoura na hora de importar o módulo — isso
// derrubava a rota inteira com um 500 sem corpo. Agora guardamos o erro e
// devolvemos um cliente que só estoura quando alguém realmente usa o banco,
// assim a rota consegue responder um JSON com uma mensagem clara.
function failingClient(err) {
  const fail = () => {
    throw err;
  };
  // Proxy recursivo: qualquer acesso (prisma.user.findMany, prisma.$connect...)
  // devolve outro proxy que estoura o mesmo erro ao ser chamado.
  const handler = {
    get: () => new Proxy(fail, handler),
    apply: fail,
  };
  return new Proxy(fail, handler);
}

function resolveClient() {
  if (process.env.KAMI_DEMO_DB === "1") {
    console.warn(
      "[kamikaze] KAMI_DEMO_DB=1: usando banco em memória (dados perdem ao reiniciar). " +
        "Não use em produção."
    );
    return createMemoryClient();
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (err) {
    return failingClient(err);
  }
}

export const prisma = globalForPrisma.prisma || resolveClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
