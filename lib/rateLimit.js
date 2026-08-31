/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Rate limit simples, em memória, por IP + rota.
// Observação: em ambientes serverless (Vercel) cada instância tem sua própria
// memória, então isso é uma camada extra de proteção best-effort, não uma
// garantia absoluta. Para produção crítica, use um limitador com estado
// compartilhado (ex.: Upstash Redis).

import { createHash } from "node:crypto";

const buckets = new Map();
let lastCleanup = Date.now();

// Evita que o Map cresça para sempre: apaga baldes expirados de vez em quando.
function cleanup(windowMs) {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > Math.max(windowMs, 300_000)) buckets.delete(key);
  }
}

export function rateLimit(key, { limit = 8, windowMs = 60_000 } = {}) {
  const now = Date.now();
  cleanup(windowMs);

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

function firstHeader(req, names) {
  for (const name of names) {
    const value = req?.headers?.get?.(name);
    if (value) return value.split(",")[0].trim();
  }
  return null;
}

// IP do cliente segundo os proxies mais comuns (Vercel, Cloudflare, Nginx...).
export function getClientIp(req) {
  const ip = firstHeader(req, [
    "x-forwarded-for",
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "true-client-ip",
    "fly-client-ip",
    "x-real-ip",
  ]);
  return ip || "unknown";
}

// Chave usada no rate limit. Quando não há IP (proxy que não repassa o
// cabeçalho), usar só "unknown" colocaria todos os visitantes no mesmo balde
// e travaria o login/cadastro de todo mundo — por isso caímos para um hash do
// navegador, que pelo menos separa os clientes.
export function getClientKey(req) {
  const ip = getClientIp(req);
  if (ip !== "unknown") return ip;

  const ua = req?.headers?.get?.("user-agent") || "no-ua";
  const hash = createHash("sha1").update(ua).digest("hex").slice(0, 10);
  return `ua:${hash}`;
}
