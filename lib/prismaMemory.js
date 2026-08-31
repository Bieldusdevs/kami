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
  g.__kamiMemoryDb = {
    users: [],
    messages: [],
    orders: [],
    commands: [],
    files: [],
    settings: [],
    seq: 0,
  };
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
      async count({ where } = {}) {
        return db.users.filter((u) => matches(u, where)).length;
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
      async update({ where, data, select } = {}) {
        const row = db.users.find((u) => matches(u, where));
        if (!row) {
          const err = new Error("Usuário não encontrado.");
          err.code = "P2025";
          throw err;
        }
        Object.assign(row, data);
        return pick(row, select);
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
      async count({ where } = {}) {
        return db.messages.filter((r) => matches(r, where)).length;
      },
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

    command: {
      async count({ where } = {}) {
        return db.commands.filter((r) => matches(r, where)).length;
      },
      async findMany({ where, orderBy } = {}) {
        const rows = sortBy(db.commands.filter((c) => matches(c, where)), orderBy || { position: "asc" });
        return rows.map((r) => ({ ...r }));
      },
      async findUnique({ where } = {}) {
        const row = db.commands.find((c) => matches(c, where));
        return row ? { ...row } : null;
      },
      async create({ data } = {}) {
        const row = {
          id: newId("cmd_"),
          category: "geral",
          position: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        };
        db.commands.push(row);
        return { ...row };
      },
      async update({ where, data } = {}) {
        const row = db.commands.find((c) => matches(c, where));
        if (!row) {
          const err = new Error("Comando não encontrado.");
          err.code = "P2025";
          throw err;
        }
        Object.assign(row, data, { updatedAt: new Date().toISOString() });
        return { ...row };
      },
      async delete({ where } = {}) {
        const idx = db.commands.findIndex((c) => matches(c, where));
        if (idx === -1) {
          const err = new Error("Comando não encontrado.");
          err.code = "P2025";
          throw err;
        }
        const [removed] = db.commands.splice(idx, 1);
        return { ...removed };
      },
    },

    downloadFile: {
      async count({ where } = {}) {
        return db.files.filter((r) => matches(r, where)).length;
      },
      async findMany({ where, orderBy } = {}) {
        const rows = sortBy(db.files.filter((f) => matches(f, where)), orderBy || { createdAt: "desc" });
        return rows.map((r) => ({ ...r }));
      },
      async findUnique({ where } = {}) {
        const row = db.files.find((f) => matches(f, where));
        return row ? { ...row } : null;
      },
      async create({ data } = {}) {
        const row = {
          id: newId("file_"),
          type: "citizen",
          description: null,
          version: null,
          size: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data,
        };
        db.files.push(row);
        return { ...row };
      },
      async update({ where, data } = {}) {
        const row = db.files.find((f) => matches(f, where));
        if (!row) {
          const err = new Error("Arquivo não encontrado.");
          err.code = "P2025";
          throw err;
        }
        Object.assign(row, data, { updatedAt: new Date().toISOString() });
        return { ...row };
      },
      async delete({ where } = {}) {
        const idx = db.files.findIndex((f) => matches(f, where));
        if (idx === -1) {
          const err = new Error("Arquivo não encontrado.");
          err.code = "P2025";
          throw err;
        }
        const [removed] = db.files.splice(idx, 1);
        return { ...removed };
      },
    },

    setting: {
      async count({ where } = {}) {
        return db.settings.filter((r) => matches(r, where)).length;
      },
      async findMany() {
        return db.settings.map((r) => ({ ...r }));
      },
      async findUnique({ where } = {}) {
        const row = db.settings.find((s) => matches(s, where));
        return row ? { ...row } : null;
      },
      async upsert({ where, create, update } = {}) {
        const row = db.settings.find((s) => matches(s, where));
        if (row) {
          Object.assign(row, update, { updatedAt: new Date().toISOString() });
          return { ...row };
        }
        const created = {
          updatedAt: new Date().toISOString(),
          ...create,
        };
        db.settings.push(created);
        return { ...created };
      },
    },

    order: {
      async count({ where } = {}) {
        return db.orders.filter((r) => matches(r, where)).length;
      },
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
      async delete({ where } = {}) {
        const idx = db.orders.findIndex((o) => matches(o, where));
        if (idx === -1) {
          const err = new Error("Pedido não encontrado.");
          err.code = "P2025";
          throw err;
        }
        const [removed] = db.orders.splice(idx, 1);
        return { ...removed };
      },
    },
  };
}
