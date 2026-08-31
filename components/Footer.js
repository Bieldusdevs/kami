/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
"use client";

import { useSettings } from "@/context/SettingsContext";
export default function Footer() {
  const { settings } = useSettings();
  const discord = (settings["site.discord"] || "").trim();

  return (
    <footer className="relative z-10 border-t border-line px-10 py-10 flex justify-between items-center text-muted text-[12.5px] max-w-[1240px] mx-auto flex-wrap gap-3">
      <span>KAMIKAZE 神風 — 侍チーム © {new Date().getFullYear()}</span>
      <span className="flex items-center gap-3">
        Feito para quem não espera o farm chegar sozinho.
        {discord && (
          <a
            href={discord}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-bright hover:text-blue-glow"
          >
            Discord
          </a>
        )}
      </span>
    </footer>
  );
}
