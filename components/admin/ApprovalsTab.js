/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
"use client";

// Aba "Aprovações" do painel: solicitações para entrar na equipe.
// A gerência aprova, recusa ou apaga — a decisão é notificada no Discord
// (quando o webhook está configurado) e aparece para o membro no site.

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch, apiDelete } from "@/lib/clientApi";

const STATUS = ["pendente", "aprovado", "recusado"];
const STATUS_STYLE = {
  pendente: "text-[#ffc857] border-[#ffc85755]",
  aprovado: "text-ok border-[#4fd6a855]",
  recusado: "text-danger border-danger/40",
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

export default function ApprovalsTab() {
  const [applications, setApplications] = useState(null);
  const [filter, setFilter] = useState("pendente");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    const res = await apiGet("/api/applications");
    if (res.ok) setApplications(res.data.applications || []);
    else {
      setApplications([]);
      setErr(res.error);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const visible = (applications || []).filter((a) => !filter || a.status === filter);
  const pendingCount = (applications || []).filter((a) => a.status === "pendente").length;

  async function decide(id, status) {
    setErr("");
    setOk("");
    setBusyId(id);
    const res = await apiPatch(`/api/applications/${id}`, { status });
    setBusyId(null);
    if (!res.ok) setErr(res.error);
    else {
      setOk(status === "aprovado" ? "Solicitação aprovada!" : "Solicitação recusada.");
      load();
    }
  }

  async function remove(id) {
    setErr("");
    setOk("");
    setBusyId(id);
    const res = await apiDelete(`/api/applications/${id}`);
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
            {s === "pendente" && pendingCount > 0 && (
              <span className="ml-1.5 text-[#ffc857]">({pendingCount})</span>
            )}
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
      {ok && (
        <div className="mb-4 text-ok text-[12.5px] border border-[#4fd6a855] bg-[#4fd6a80d] px-4 py-2.5">
          {ok}
        </div>
      )}

      {applications === null ? (
        <div className="text-muted text-[13.5px]">Carregando solicitações...</div>
      ) : visible.length === 0 ? (
        <div className="text-muted text-[13.5px] border border-line bg-bgAlt p-6">
          Nenhuma solicitação {filter ? `com status "${filter}"` : "ainda"}.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((a) => (
            <div
              key={a.id}
              className="bg-bgAlt border border-line p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <b className="text-[15px]">{a.username}</b>
                  <span className="text-[11.5px] text-muted px-2 py-0.5 border border-lineStrong">
                    🎮 {a.discord}
                  </span>
                  <span className={`text-[11px] px-2.5 py-1 border ${STATUS_STYLE[a.status]}`}>
                    {a.status}
                  </span>
                  {a.proofUrl && (
                    <a
                      href={a.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11.5px] text-blue-bright hover:underline"
                    >
                      📎 ver comprovante
                    </a>
                  )}
                </div>
                <div className="text-[13px] text-muted mt-1.5">{a.motivation}</div>
                <div className="text-[11.5px] text-muted mt-1.5">
                  Enviada em {fmtDate(a.createdAt)}
                  {a.decidedBy && ` · decidida por ${a.decidedBy} em ${fmtDate(a.decidedAt)}`}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {a.status === "pendente" && (
                  <>
                    <button
                      onClick={() => decide(a.id, "aprovado")}
                      disabled={busyId === a.id}
                      className="px-3 py-2 text-[12.5px] border border-[#4fd6a855] text-ok hover:border-ok hover:bg-[#4fd6a80d] disabled:opacity-50"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => decide(a.id, "recusado")}
                      disabled={busyId === a.id}
                      className="px-3 py-2 text-[12.5px] border border-danger/40 text-danger hover:border-danger hover:bg-danger/5 disabled:opacity-50"
                    >
                      ✕ Recusar
                    </button>
                  </>
                )}
                <button
                  onClick={() => remove(a.id)}
                  disabled={busyId === a.id}
                  className="px-3 py-2 text-[12.5px] border border-lineStrong text-muted hover:text-danger hover:border-danger disabled:opacity-50"
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
