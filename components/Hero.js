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

import { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";

export default function Hero() {
  const [stats, setStats] = useState({ members: "—", orders: "—" });
  const { settings } = useSettings();
  const subtitle =
    settings["site.heroSubtitle"] ||
    "A Kamikaze é uma equipe formada para dominar o farm, o ranking e a comunicação — tudo em um só lugar.";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [mRes, oRes] = await Promise.all([
          fetch("/api/members", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
        ]);
        const mData = await mRes.json();
        const oData = await oRes.json();
        if (cancelled) return;
        setStats({
          members: mData.members?.length ?? 0,
          orders: oData.orders?.filter((o) => o.status === "concluido").length ?? 0,
        });
      } catch {
        // silencioso — os números seguem com "—"
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-32 px-6 md:px-10 max-w-[1240px] mx-auto">
      <div className="hero-kanji">風</div>
      <div className="relative z-10 max-w-[640px]">
        <div className="flex items-center gap-2.5 mb-6">
          <span className="w-[7px] h-[7px] rounded-full bg-blue-bright shadow-[0_0_12px_#5b9cff]" />
          <span className="text-[13px] text-muted font-jp tracking-[0.15em]">
            神風 · EQUIPE COMPETITIVA
          </span>
        </div>
        <h1 className="font-display text-[42px] md:text-[74px] leading-[1.02] mb-6">
          Rápidos como
          <br />o vento, <span className="text-blue-bright">precisos</span>
          <br />como a lâmina.
        </h1>
        <p className="text-[17px] text-muted leading-relaxed max-w-[480px] mb-10">
          {subtitle}
        </p>
        <div className="flex gap-4 flex-wrap">
          <a
            href="#farm"
            className="px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
          >
            Pedir entrega de farm
          </a>
          <a
            href="/arquivos"
            className="px-5 py-2.5 text-[13.5px] font-semibold border border-lineStrong hover:border-blue-bright hover:text-blue-glow transition-colors"
          >
            Baixar arquivos
          </a>
        </div>
        <div className="flex gap-12 mt-16">
          <div>
            <b className="block font-display text-[30px]">{stats.members}</b>
            <span className="text-[12.5px] text-muted">Membros ativos</span>
          </div>
          <div>
            <b className="block font-display text-[30px]">{stats.orders}</b>
            <span className="text-[12.5px] text-muted">Entregas concluídas</span>
          </div>
          <div>
            <b className="block font-display text-[30px]">24/7</b>
            <span className="text-[12.5px] text-muted">Esquadrão de plantão</span>
          </div>
        </div>
      </div>
    </section>
  );
}
