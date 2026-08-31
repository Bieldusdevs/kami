/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Banco em memória usado SOMENTE para demonstração/testes locais, quando a
// variável KAMI_DEMO_DB=1 está ligada. Não serve para produção: os dados vivem
// apenas no processo do servidor e somem quando ele reinicia.
// ATENÇÃO: nunca ative isso no deploy — configure DATABASE_URL de verdade.

const g = globalThis;

function newId(prefix) {
  db.seq += 1;
  return `${prefix}${Date.now().toString(36)}${db.seq}`;
}

if (!g.__kamiMemoryDb) {
  g.__kamiMemoryDb = { users: [], messages: [], orders: [], seq: 0 };
}
const db = g.__kamiMemoryDb;

function pick(row, select) {
  if (!select) return { ...row };
  const out = {};
  for (const key of Object.keys(select)) if (select[key]) out[key] = row[key];
  return out;
}

function sortBy(rows, orderBy) {
  if (!orderBy) return rows;
  const [key, dir] = Object.entries(orderBy)[0];
  return [...rows].sort((a, b) => {
    if (a[key] === b[key]) return 0;
    const cmp = a[key] > b[key] ? 1 : -1;
    return dir === "desc" ? -cmp : cmp;
  });
}

function matches(row, where) {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "OR") {
      if (!cond.some((sub) => matches(row, sub))) return false;
      continue;
    }
    if (cond && typeof cond === "object") continue;
    if (row[key] !== cond) return false;
  }
  return true;
}

function withUser(row, include) {
  if (!include?.user) return { ...row };
  const user = db.users.find((u) => u.id === row.userId);
  return { ...row, user: { id: user?.id ?? null, username: user?.username ?? "?" } };
}

export function createMemoryClient() {
  return {
    async $connect() {},
    async $disconnect() {},
    async $queryRawUnsafe() {
      return [{ ok: 1 }];
    },

    user: {
      async count() {
        return db.users.length;
      },
      async findFirst({ where, select } = {}) {
        const row = db.users.find((u) => matches(u, where));
        return row ? pick(row, select) : null;
      },
      async findUnique({ where, select } = {}) {
        const row = db.users.find((u) => matches(u, where));
        return row ? pick(row, select) : null;
      },
      async findMany({ where, select, orderBy, take } = {}) {
        let rows = sortBy(db.users.filter((u) => matches(u, where)), orderBy);
        if (take != null) rows = rows.slice(0, take);
        return rows.map((r) => pick(r, select));
      },
      async create({ data, select } = {}) {
        const row = {
          id: newId("usr_"),
          role: "Membro",
          createdAt: new Date().toISOString(),
          ...data,
        };
        db.users.push(row);
        return pick(row, select);
      },
    },

    message: {
      async findMany({ orderBy, take, include } = {}) {
        let rows = sortBy(db.messages, orderBy);
        if (take != null) rows = rows.slice(0, take);
        return rows.map((r) => withUser(r, include));
      },
      async create({ data, include } = {}) {
        const row = { id: newId("msg_"), createdAt: new Date().toISOString(), ...data };
        db.messages.push(row);
        return withUser(row, include);
      },
    },

    order: {
      async findMany({ orderBy, take, include } = {}) {
        let rows = sortBy(db.orders, orderBy);
        if (take != null) rows = rows.slice(0, take);
        return rows.map((r) => withUser(r, include));
      },
      async findUnique({ where } = {}) {
        const row = db.orders.find((o) => matches(o, where));
        return row ? { ...row } : null;
      },
      async create({ data, include } = {}) {
        const row = {
          id: newId("ord_"),
          status: "pendente",
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        };
        db.orders.push(row);
        return withUser(row, include);
      },
      async update({ where, data, include } = {}) {
        const row = db.orders.find((o) => matches(o, where));
        if (!row) {
          const err = new Error("Registro não encontrado.");
          err.code = "P2025";
          throw err;
        }
        Object.assign(row, data, { updatedAt: new Date().toISOString() });
        return withUser(row, include);
      },
    },
  };
}
