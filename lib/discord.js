/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Integração com o Discord via webhook (somente servidor).
//
// Configure a variável DISCORD_WEBHOOK_URL no servidor (Vercel → Settings →
// Environment Variables). Para criar o webhook:
//   Discord → canal da equipe → Editar canal → Integrações → Webhooks → Novo
//   → copie a URL (https://discord.com/api/webhooks/...).
//
// Sem a variável configurada tudo continua funcionando: as notificações são
// simplesmente ignoradas (nunca derrubam uma requisição).

export function discordEnabled() {
  return Boolean((process.env.DISCORD_WEBHOOK_URL || "").trim());
}

// Envia um embed para o webhook. Nunca lança erro — devolve true/false.
// Uso:
//   await notifyDiscord({
//     title: "Nova solicitação",
//     description: "**novak** quer entrar na equipe",
//     fields: [{ name: "Discord", value: "@novak", inline: true }],
//   });
export async function notifyDiscord({ title, description, fields = [], color = 0x2f6fed, footer } = {}) {
  const url = (process.env.DISCORD_WEBHOOK_URL || "").trim();
  if (!url) return false;

  const embed = { timestamp: new Date().toISOString() };
  if (title) embed.title = String(title).slice(0, 256);
  if (description) embed.description = String(description).slice(0, 4000);
  if (fields.length) {
    embed.fields = fields.slice(0, 25).map((f) => ({
      name: String(f.name || "").slice(0, 256),
      value: String(f.value || "-").slice(0, 1024),
      inline: Boolean(f.inline),
    }));
  }
  if (footer) embed.footer = { text: String(footer).slice(0, 2048) };
  if (typeof color === "number") embed.color = color;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "KAMIKAZE 神風", embeds: [embed] }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`[kamikaze] webhook do Discord respondeu ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    // Timeout, URL inválida, Discord fora do ar... o site segue em frente.
    console.warn("[kamikaze] falha ao notificar o Discord:", err?.message || err);
    return false;
  }
}
