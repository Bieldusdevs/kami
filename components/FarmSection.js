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

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

const GAMES = ["Valorant", "League of Legends", "CS2", "Genshin Impact", "World of Warcraft", "Outro"];
const STATUS_STYLE = {
  pendente: "text-[#ffc857] border-[#ffc85755]",
  andamento: "text-blue-bright border-blue-bright",
  concluido: "text-ok border-[#4fd6a855]",
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FarmSection() {
  const { user, openAuth } = useUser();
  const [orders, setOrders] = useState(null);
  const [form, setForm] = useState({ game: GAMES[0], item: "", qty: "", notes: "" });
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const t = setInterval(loadOrders, 8000);
    return () => clearInterval(t);
  }, [loadOrders]);

  async function submit() {
    setErr("");
    if (!form.item.trim() || !form.qty.trim()) {
      setErr("Preencha o item e a quantidade.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Erro ao enviar pedido.");
        return;
      }
      setForm({ game: GAMES[0], item: "", qty: "", notes: "" });
      loadOrders();
    } catch {
      setErr("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="farm" className="relative px-6 md:px-10 py-24 max-w-[1240px] mx-auto">
      <div className="flex justify-between items-end mb-12 gap-6 flex-wrap">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">01 — 農場</div>
          <h2 className="font-display text-[30px] md:text-[42px]">Entrega de Farm</h2>
        </div>
        <p className="text-muted text-[14.5px] max-w-[360px] leading-relaxed">
          Solicite o farm do seu personagem ou conta. O esquadrão pega o pedido e você acompanha o status em tempo real.
        </p>
      </div>

      {!user ? (
        <div className="flex flex-col items-start gap-4 py-16 text-muted">
          <span className="font-display text-[13px] text-blue-bright tracking-[0.1em]">ログインが必要です</span>
          <p>Você precisa entrar na conta para solicitar uma entrega de farm.</p>
          <button
            onClick={() => openAuth("login")}
            className="px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
          >
            Entrar para continuar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
          <div className="bg-bgAlt p-9">
            <h3 className="text-[18px] mb-6 flex items-center gap-2.5">📦 Novo pedido</h3>

            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Jogo</label>
              <select
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              >
                {GAMES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5 mb-4">
              <div>
                <label className="block text-[12.5px] text-muted mb-1.5">Item / Recurso</label>
                <input
                  type="text"
                  placeholder="ex: Ouro, XP, Rank"
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
              <div>
                <label className="block text-[12.5px] text-muted mb-1.5">Quantidade</label>
                <input
                  type="text"
                  placeholder="ex: 10.000"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Observações</label>
              <textarea
                rows={3}
                placeholder="horário preferido, conta, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>

            <button
              onClick={submit}
              disabled={sending}
              className="w-full px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Solicitar entrega"}
            </button>
            {err && <div className="text-danger text-[12.5px] mt-2.5">{err}</div>}
          </div>

          <div className="bg-bgAlt p-9">
            <h3 className="text-[18px] mb-6 flex items-center gap-2.5">📋 Fila de entregas</h3>
            {orders === null ? (
              <div className="text-muted text-[13.5px] py-5">Carregando pedidos...</div>
            ) : orders.length === 0 ? (
              <div className="text-muted text-[13.5px] py-5">Nenhum pedido ainda. Seja o primeiro a solicitar farm.</div>
            ) : (
              orders.slice(0, 12).map((o) => (
                <div key={o.id} className="border border-line px-4.5 py-4 mb-2.5 flex justify-between items-center gap-3">
                  <div>
                    <div className="font-semibold text-sm">{o.username} · {o.game}</div>
                    <div className="text-[12.5px] text-muted mt-1">{o.item} — {o.qty} · {fmtDate(o.createdAt)}</div>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1.5 border whitespace-nowrap ${STATUS_STYLE[o.status]}`}>
                    {o.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
