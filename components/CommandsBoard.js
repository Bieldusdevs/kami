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

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { isStaff } from "@/lib/roles";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/clientApi";

const EMPTY = { name: "", description: "", category: "geral", position: 0 };

export default function CommandsBoard() {
  const { user } = useUser();
  const { settings } = useSettings();
  const staff = isStaff(user?.role);

  const [commands, setCommands] = useState(null);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = useCallback(async () => {
    const res = await apiGet("/api/commands");
    if (res.ok) setCommands(res.data.commands || []);
    else setCommands([]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const list = commands || [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      `${c.name} ${c.description} ${c.category}`.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const c of filtered) {
      const key = (c.category || "geral").trim() || "geral";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return [...map.entries()];
  }, [filtered]);

  async function save(e) {
    e?.preventDefault();
    setErr("");
    if (!draft.name.trim() || !draft.description.trim()) {
      setErr("Preencha o comando e a descrição.");
      return;
    }
    setSaving(true);
    const res = editingId
      ? await apiPatch(`/api/commands/${editingId}`, draft)
      : await apiPost("/api/commands", draft);
    setSaving(false);

    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setDraft(EMPTY);
    setEditingId(null);
    load();
  }

  async function remove(id) {
    setErr("");
    const res = await apiDelete(`/api/commands/${id}`);
    if (!res.ok) setErr(res.error);
    else load();
  }

  const notice = (settings["comandos.notice"] || "").trim();

  return (
    <section className="relative px-6 md:px-10 pt-32 pb-24 max-w-[1240px] mx-auto">
      <div className="flex justify-between items-end mb-10 gap-6 flex-wrap">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">
            コマンド — FIVEM
          </div>
          <h1 className="font-display text-[30px] md:text-[42px]">Comandos do servidor</h1>
        </div>
        <p className="text-muted text-[14.5px] max-w-[360px] leading-relaxed">
          Lista oficial de comandos da Kamikaze no FiveM.
          {staff ? " Seu cargo pode editar tudo por aqui mesmo." : ""}
        </p>
      </div>

      {notice && (
        <div className="mb-8 border border-lineStrong bg-panel px-5 py-3.5 text-[13px] text-blue-glow">
          📌 {notice}
        </div>
      )}

      <div className="flex gap-3.5 mb-8 flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar comando ou descrição..."
          className="flex-1 min-w-[240px] bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
        />
        <Link
          href="/arquivos"
          className="px-5 py-2.5 text-[13.5px] font-semibold border border-lineStrong hover:border-blue-bright hover:text-blue-glow transition-colors"
        >
          Ir para arquivos
        </Link>
      </div>

      {staff && (
        <form
          onSubmit={save}
          className="bg-bgAlt border border-line p-6 mb-10 grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end"
        >
          <div>
            <label className="block text-[12.5px] text-muted mb-1.5">Comando</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="/dv"
              className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[12.5px] text-muted mb-1.5">Descrição</label>
            <input
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Deleta o veículo mais próximo"
              className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
            />
          </div>
          <div>
            <label className="block text-[12.5px] text-muted mb-1.5">Categoria</label>
            <input
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              placeholder="geral"
              className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
            >
              {saving ? "Salvando..." : editingId ? "Salvar" : "Adicionar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDraft(EMPTY);
                }}
                className="px-3 py-3 text-[13px] border border-lineStrong hover:border-blue-bright"
              >
                ✕
              </button>
            )}
          </div>
          {err && <div className="md:col-span-5 text-danger text-[12.5px]">{err}</div>}
        </form>
      )}

      {commands === null ? (
        <div className="text-muted text-[13.5px]">Carregando comandos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-muted text-[13.5px] border border-line bg-bgAlt p-6">
          Nenhum comando cadastrado ainda.
          {staff ? " Use o formulário acima para criar o primeiro." : ""}
        </div>
      ) : (
        grouped.map(([category, items]) => (
          <div key={category} className="mb-10">
            <h2 className="font-display text-[18px] mb-4 flex items-center gap-2.5">
              <span className="text-blue-bright">▸</span>
              {category}
              <span className="text-[12px] text-muted">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
              {items.map((c) => (
                <div key={c.id} className="bg-bgAlt p-5 flex justify-between items-start gap-4">
                  <div>
                    <code className="text-[14px] text-blue-bright font-semibold">{c.name}</code>
                    <div className="text-[13px] text-muted mt-1.5 leading-relaxed">
                      {c.description}
                    </div>
                  </div>
                  {staff && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setDraft({
                            name: c.name,
                            description: c.description,
                            category: c.category,
                            position: c.position ?? 0,
                          });
                        }}
                        className="px-2.5 py-1.5 text-[12px] border border-lineStrong hover:border-blue-bright hover:text-blue-glow"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="px-2.5 py-1.5 text-[12px] border border-lineStrong text-danger hover:border-danger"
                      >
                        Apagar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
