/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Leitura/gravação das configurações no banco (somente servidor).
// Para usar os padrões/helpers no navegador, importe "@/lib/settingsShared".

import { prisma } from "./prisma";
import { SETTINGS_SCHEMA, defaultSettings, parseGames, serializeGames } from "./settingsShared";

export { SETTINGS_SCHEMA, defaultSettings, parseGames, serializeGames };
export * from "./settingsShared";

// Lê todas as configurações mesclando com os padrões.
export async function getSettings() {
  const merged = defaultSettings();
  try {
    const rows = await prisma.setting.findMany();
    for (const row of rows) {
      if (Object.prototype.hasOwnProperty.call(SETTINGS_SCHEMA, row.key)) {
        merged[row.key] = row.value;
      }
    }
  } catch {
    // Sem tabela/banco: seguimos com os padrões.
  }
  return merged;
}

// Salva várias chaves de uma vez (usado pelo painel).
export async function saveSettings(patch) {
  const updates = [];
  for (const [key, value] of Object.entries(patch || {})) {
    if (!Object.prototype.hasOwnProperty.call(SETTINGS_SCHEMA, key)) continue;
    const meta = SETTINGS_SCHEMA[key];
    let finalValue = String(value ?? "");

    if (meta.tipo === "url") finalValue = finalValue.trim();
    if (meta.tipo === "lista") {
      finalValue = Array.isArray(value)
        ? serializeGames(value)
        : serializeGames(parseGames(finalValue));
    }

    updates.push(
      prisma.setting.upsert({
        where: { key },
        update: { value: finalValue },
        create: { key, value: finalValue },
      })
    );
  }
  await Promise.all(updates);
  return getSettings();
}
