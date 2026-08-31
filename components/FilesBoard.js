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
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { isStaff } from "@/lib/roles";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/clientApi";

const TYPES = [
  { id: "citizen", label: "Citizen", emoji: "📁", dica: "Pasta citizen do FiveM" },
  { id: "modsom", label: "Mod Som", emoji: "🔊", dica: "Mods de som (sirenes, motores...)" },
  { id: "outros", label: "Outros", emoji: "🧩", dica: "Qualquer outro arquivo do time" },
];

const EMPTY = { title: "", type: "citizen", url: "", description: "", version: "", size: "" };

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FilesBoard() {
  const { user, loading, openAuth } = useUser();
  const { settings } = useSettings();
  const staff = isStaff(user?.role);

  const [files, setFiles] = useState([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await apiGet("/api/files");
    if (res.ok) setFiles(res.data.files || []);
    else setFiles([]);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function save(e) {
    e?.preventDefault();
    setErr("");
    if (!draft.title.trim() || !draft.url.trim()) {
      setErr("Preencha o título e o link do arquivo.");
      return;
    }
    setSaving(true);
    const res = editingId
      ? await apiPatch(`/api/files/${editingId}`, draft)
      : await apiPost("/api/files", draft);
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
    const res = await apiDelete(`/api/files/${id}`);
    if (!res.ok) setErr(res.error);
    else load();
  }

  async function upload(file) {
    setErr("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", draft.type || "outros");
    const res = await apiRequestUpload(fd);
    setUploading(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setDraft((d) => ({ ...d, url: res.data.url }));
  }

  const notice = (settings["arquivos.notice"] || "").trim();

  return (
    <section className="relative px-6 md:px-10 pt-32 pb-24 max-w-[1240px] mx-auto">
      <div className="flex justify-between items-end mb-10 gap-6 flex-wrap">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">
            ダウンロード — FIVEM
          </div>
          <h1 className="font-display text-[30px] md:text-[42px]">Arquivos da equipe</h1>
        </div>
        <p className="text-muted text-[14.5px] max-w-[360px] leading-relaxed">
          Citizen, mod de som e o que mais o time precisar — área exclusiva de membros.
        </p>
      </div>

      {notice && (
        <div className="mb-8 border border-lineStrong bg-panel px-5 py-3.5 text-[13px] text-blue-glow">
          ⚠️ {notice}
        </div>
      )}

      {!loading && !user ? (
        <div className="flex flex-col items-start gap-4 py-14 text-muted border border-line bg-bgAlt p-8">
          <span className="font-display text-[13px] text-blue-bright tracking-[0.1em]">
            メンバー限定
          </span>
          <p>Os arquivos são só para membros da Kamikaze. Entre para liberar os downloads.</p>
          <button
            onClick={() => openAuth("login")}
            className="px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
          >
            Entrar para continuar
          </button>
        </div>
      ) : (
        <>
          {staff && (
            <form
              onSubmit={save}
              className="bg-bgAlt border border-line p-6 mb-10 grid grid-cols-1 md:grid-cols-6 gap-3.5 items-end"
            >
              <div className="md:col-span-2">
                <label className="block text-[12.5px] text-muted mb-1.5">Título</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Citizen Kamikaze v3"
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
              <div>
                <label className="block text-[12.5px] text-muted mb-1.5">Tipo</label>
                <select
                  value={draft.type}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                >
                  {TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] text-muted mb-1.5">Versão</label>
                <input
                  value={draft.version || ""}
                  onChange={(e) => setDraft({ ...draft, version: e.target.value })}
                  placeholder="v1.2"
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
              <div>
                <label className="block text-[12.5px] text-muted mb-1.5">Tamanho</label>
                <input
                  value={draft.size || ""}
                  onChange={(e) => setDraft({ ...draft, size: e.target.value })}
                  placeholder="120 MB"
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
              <div>
                <label className="block text-[12.5px] text-muted mb-1.5">Enviar arquivo</label>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                  className="w-full text-[12px] text-muted file:mr-2 file:px-3 file:py-2 file:border-0 file:bg-blue file:text-white file:text-[12px]"
                />
              </div>
              <div className="md:col-span-5">
                <label className="block text-[12.5px] text-muted mb-1.5">
                  Link do download (https://)
                </label>
                <input
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://drive.google.com/... ou link do Discord"
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-4 py-3 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
              >
                {uploading ? "Enviando..." : saving ? "Salvando..." : editingId ? "Salvar" : "Publicar"}
              </button>
              <div className="md:col-span-5">
                <label className="block text-[12.5px] text-muted mb-1.5">Descrição</label>
                <input
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="O que mudou nessa versão, como instalar..."
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDraft(EMPTY);
                  }}
                  className="px-4 py-3 text-[13px] border border-lineStrong hover:border-blue-bright"
                >
                  Cancelar
                </button>
              )}
              {err && <div className="md:col-span-6 text-danger text-[12.5px]">{err}</div>}
            </form>
          )}

          {TYPES.map((type) => {
            const items = files.filter((f) => f.type === type.id);
            return (
              <div key={type.id} className="mb-12">
                <h2 className="font-display text-[20px] mb-1.5 flex items-center gap-2.5">
                  <span>{type.emoji}</span> {type.label}
                </h2>
                <p className="text-[13px] text-muted mb-5">{type.dica}</p>

                {items.length === 0 ? (
                  <div className="text-muted text-[13.5px] border border-line bg-bgAlt p-6">
                    Nada publicado aqui ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line">
                    {items.map((f) => (
                      <div key={f.id} className="bg-bgAlt p-5 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-3">
                          <b className="text-[15px]">{f.title}</b>
                          <span className="text-[11px] text-muted whitespace-nowrap">
                            {[f.version, f.size].filter(Boolean).join(" · ")}
                          </span>
                        </div>
                        {f.description && (
                          <p className="text-[13px] text-muted leading-relaxed">{f.description}</p>
                        )}
                        <div className="text-[11.5px] text-muted">{fmtDate(f.createdAt)}</div>
                        <div className="flex gap-2 mt-1">
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-[13px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
                          >
                            Baixar
                          </a>
                          {staff && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(f.id);
                                  setDraft({
                                    title: f.title,
                                    type: f.type,
                                    url: f.url,
                                    description: f.description || "",
                                    version: f.version || "",
                                    size: f.size || "",
                                  });
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="px-3 py-2 text-[12.5px] border border-lineStrong hover:border-blue-bright hover:text-blue-glow"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => remove(f.id)}
                                className="px-3 py-2 text-[12.5px] border border-lineStrong text-danger hover:border-danger"
                              >
                                Apagar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

async function apiRequestUpload(formData) {
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const text = await res.text().catch(() => "");
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {}
    if (!res.ok) return { ok: false, error: data.error || "Falha no upload." };
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Falha de conexão durante o upload." };
  }
}
