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

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "@/lib/clientApi";

const STATUS = ["pendente", "andamento", "concluido"];
const STATUS_STYLE = {
  pendente: "text-[#ffc857] border-[#ffc85755]",
  andamento: "text-blue-bright border-blue-bright",
  concluido: "text-ok border-[#4fd6a855]",
};

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersTab() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const res = await apiGet(filter ? `/api/admin/orders?status=${filter}` : "/api/admin/orders");
    if (res.ok) setOrders(res.data.orders || []);
    else {
      setOrders([]);
      setErr(res.error);
    }
  }, [filter]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function changeStatus(id, status) {
    setErr("");
    setBusyId(id);
    const res = await apiPatch(`/api/admin/orders/${id}`, { status });
    setBusyId(null);
    if (!res.ok) setErr(res.error);
    else load();
  }

  async function remove(id) {
    setErr("");
    setBusyId(id);
    const res = await apiDelete(`/api/admin/orders/${id}`);
    setBusyId(null);
    if (!res.ok) setErr(res.error);
    else load();
  }

  return (
    <div>
      <div className="flex gap-2.5 mb-6 flex-wrap">
        {["", ...STATUS].map((s) => (
          <button
            key={s || "todos"}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-2 text-[12.5px] border transition-colors ${
              filter === s
                ? "border-blue-bright text-blue-bright"
                : "border-lineStrong text-muted hover:text-ink"
            }`}
          >
            {s || "Todos"}
          </button>
        ))}
        <button
          onClick={load}
          className="px-3.5 py-2 text-[12.5px] border border-lineStrong text-muted hover:text-ink ml-auto"
        >
          Atualizar
        </button>
      </div>

      {err && (
        <div className="mb-4 text-danger text-[12.5px] border border-danger/40 bg-danger/5 px-4 py-2.5">
          {err}
        </div>
      )}

      {orders === null ? (
        <div className="text-muted text-[13.5px]">Carregando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="text-muted text-[13.5px] border border-line bg-bgAlt p-6">
          Nenhum pedido {filter ? `com status "${filter}"` : "ainda"}.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-bgAlt border border-line p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <b className="text-[15px]">{o.username}</b>
                  <span className="text-[11.5px] text-muted px-2 py-0.5 border border-lineStrong">
                    {o.game}
                  </span>
                  <span className={`text-[11px] px-2.5 py-1 border ${STATUS_STYLE[o.status]}`}>
                    {o.status}
                  </span>
                </div>
                <div className="text-[13px] mt-1.5">
                  {o.item} — <b>{o.qty}</b>
                </div>
                {o.notes && (
                  <div className="text-[12.5px] text-muted mt-1">Obs: {o.notes}</div>
                )}
                <div className="text-[11.5px] text-muted mt-1.5">{fmtDate(o.createdAt)}</div>
              </div>

              <div className="flex gap-2 shrink-0">
                <select
                  value={o.status}
                  disabled={busyId === o.id}
                  onChange={(e) => changeStatus(o.id, e.target.value)}
                  className="bg-bgAlt border border-lineStrong px-3 py-2 text-[12.5px] outline-none focus:border-blue-bright"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => remove(o.id)}
                  disabled={busyId === o.id}
                  className="px-3 py-2 text-[12.5px] border border-lineStrong text-danger hover:border-danger disabled:opacity-50"
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
