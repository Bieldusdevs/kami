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

function initials(name) {
  return name?.slice(0, 2).toUpperCase() || "";
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MembersSection() {
  const [members, setMembers] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/members", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setMembers(data.members || []);
      } catch {
        if (!cancelled) setMembers([]);
      }
    }
    load();
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <section id="membros" className="relative px-6 md:px-10 py-24 max-w-[1240px] mx-auto">
      <div className="flex justify-between items-end mb-12 gap-6 flex-wrap">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">03 — 隊員</div>
          <h2 className="font-display text-[30px] md:text-[42px]">Membros</h2>
        </div>
        <p className="text-muted text-[14.5px] max-w-[360px] leading-relaxed">
          Todos os guerreiros registrados na Kamikaze.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-px bg-line border border-line">
        {members === null ? (
          <div className="bg-bgAlt p-6 text-muted text-[13.5px]">Carregando membros...</div>
        ) : members.length === 0 ? (
          <div className="bg-bgAlt p-6 text-muted text-[13.5px]">Nenhum membro cadastrado ainda.</div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="bg-bgAlt p-6.5">
              <div className="w-11.5 h-11.5 bg-gradient-to-br from-blue to-[#0b1730] flex items-center justify-center font-bold mb-4 font-display">
                {initials(m.username)}
              </div>
              <b className="block text-[15px]">{m.username}</b>
              <div className="text-xs text-blue-bright mt-0.5">{m.role}</div>
              <div className="text-[11.5px] text-muted mt-3">Desde {fmtDate(m.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
