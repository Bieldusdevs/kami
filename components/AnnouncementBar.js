/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
"use client";

import { useSettings } from "@/context/SettingsContext";

// Faixa de aviso no topo — o admin escreve o texto pelo painel.
// Renderizada dentro do <header>, então acompanha o menu fixo.
export default function AnnouncementBar() {
  const { settings } = useSettings();
  const text = (settings["site.announcement"] || "").trim();

  if (!text) return null;

  return (
    <div className="w-full bg-blue/10 border-b border-line">
      <div className="px-6 md:px-10 py-2 flex items-center justify-center gap-2.5 text-[12.5px] text-blue-glow">
        <span className="w-[6px] h-[6px] rounded-full bg-blue-bright shadow-[0_0_10px_#5b9cff] shrink-0" />
        <span className="text-center leading-snug">{text}</span>
      </div>
    </div>
  );
}
