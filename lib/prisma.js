/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { createMemoryClient } from "./prismaMemory";
import { bootstrapTables } from "./ensureTables";

// Evita criar múltiplas instâncias do Prisma Client durante hot-reload
// em desenvolvimento e em ambientes serverless da Vercel.
const globalForPrisma = globalThis;

// Quando a variável DATABASE_URL não existe (ou o Prisma Client não foi
// gerado), o simples `import "@prisma/client"` já estourava e derrubava a
// rota inteira com um 500 sem corpo — ninguém conseguia nem ler a mensagem.
// Aqui o import é feito só quando alguém realmente vai usar o banco, e o erro
// vira uma resposta JSON com dica do que fazer (ver lib/apiErrors.js).
async function createClient() {
  if (process.env.KAMI_DEMO_DB === "1") {
    console.warn(
      "[kamikaze] KAMI_DEMO_DB=1: usando banco em memória (dados perdem ao reiniciar). " +
        "Não use em produção."
    );
    return createMemoryClient();
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

    // Na Vercel ninguém roda `prisma db push` no terminal, então garantimos
    // que as tabelas existam antes do primeiro uso.
    await bootstrapTables(client);

    return client;
  } catch (err) {
    // Cliente que só estoura quando é chamado — aí a rota responde JSON.
    const fail = () => {
      throw err;
    };
    const handler = {
      get: () => new Proxy(fail, handler),
      apply: fail,
    };
    return new Proxy(fail, handler);
  }
}

// Proxy preguiçoso: `prisma.user.findMany(...)` só carrega o client na hora
// da chamada, e mantém a mesma cara de sempre para quem usa.
function lazyClient(getClient, path = []) {
  return new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      return lazyClient(getClient, [...path, prop]);
    },
    apply(_target, _this, args) {
      const name = path[path.length - 1];
      const parents = path.slice(0, -1);
      return (async () => {
        const client = await getClient();
        let target = client;
        for (const key of parents) target = target[key];
        return target[name](...args);
      })();
    },
  });
}

let clientPromise = globalForPrisma.__kamiPrismaPromise;
if (!clientPromise) {
  clientPromise = createClient();
  globalForPrisma.__kamiPrismaPromise = clientPromise;
}

export const prisma = lazyClient(() => clientPromise);
