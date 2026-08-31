/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { isStaff, ROLE_BADGE } from "@/lib/roles";
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "@/lib/clientApi";
import OrdersTab from "./OrdersTab";
import MembersTab from "./MembersTab";
import ApprovalsTab from "./ApprovalsTab";

const TABS = [
  { id: "pedidos", label: "Pedidos de farm", emoji: "📦" },
  { id: "aprovacoes", label: "Aprovações", emoji: "✅" },
  { id: "site", label: "Jogos e site", emoji: "🎮" },
  { id: "comandos", label: "Comandos FiveM", emoji: "⌨️" },
  { id: "arquivos", label: "Arquivos", emoji: "📁" },
  { id: "membros", label: "Cargos", emoji: "🛡️" },
];

const FILE_TYPES = [
  { id: "citizen", label: "Citizen" },
  { id: "modsom", label: "Mod Som" },
  { id: "outros", label: "Outros" },
];

const EMPTY_COMMAND = { name: "", description: "", category: "geral", position: 0 };
const EMPTY_FILE = { title: "", type: "citizen", url: "", description: "", version: "", size: "" };

function Notice({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 text-danger text-[12.5px] border border-danger/40 bg-danger/5 px-4 py-2.5">
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const { user, loading } = useUser();
  const staff = isStaff(user?.role);

  const [tab, setTab] = useState("pedidos");
  const [schema, setSchema] = useState(null);
  const [form, setForm] = useState({});
  const [savingSite, setSavingSite] = useState(false);
  const [siteMsg, setSiteMsg] = useState("");
  const [siteErr, setSiteErr] = useState("");

  // comandos
  const [commands, setCommands] = useState([]);
  const [cmdDraft, setCmdDraft] = useState(EMPTY_COMMAND);
  const [cmdEdit, setCmdEdit] = useState(null);
  const [cmdErr, setCmdErr] = useState("");

  // arquivos
  const [files, setFiles] = useState([]);
  const [fileDraft, setFileDraft] = useState(EMPTY_FILE);
  const [fileEdit, setFileEdit] = useState(null);
  const [fileErr, setFileErr] = useState("");

  const loadSite = useCallback(async () => {
    const res = await apiGet("/api/settings");
    if (res.ok) {
      setSchema(res.data.schema || null);
      setForm((prev) => ({ ...res.data.settings, ...prev }));
    }
  }, []);

  const loadCommands = useCallback(async () => {
    const res = await apiGet("/api/commands");
    if (res.ok) setCommands(res.data.commands || []);
  }, []);

  const loadFiles = useCallback(async () => {
    const res = await apiGet("/api/files");
    if (res.ok) setFiles(res.data.files || []);
  }, []);

  useEffect(() => {
    if (!staff) return;
    loadSite();
    loadCommands();
    loadFiles();
  }, [staff, loadSite, loadCommands, loadFiles]);

  async function saveSite(e) {
    e?.preventDefault();
    setSiteErr("");
    setSiteMsg("");
    setSavingSite(true);
    const res = await apiPut("/api/settings", form);
    setSavingSite(false);
    if (!res.ok) setSiteErr(res.error);
    else {
      setSiteMsg("Salvo! Já está valendo no site.");
      setForm(res.data.settings || form);
    }
  }

  async function saveCommand(e) {
    e?.preventDefault();
    setCmdErr("");
    if (!cmdDraft.name.trim() || !cmdDraft.description.trim()) {
      setCmdErr("Preencha o comando e a descrição.");
      return;
    }
    const res = cmdEdit
      ? await apiPatch(`/api/commands/${cmdEdit}`, cmdDraft)
      : await apiPost("/api/commands", cmdDraft);
    if (!res.ok) setCmdErr(res.error);
    else {
      setCmdDraft(EMPTY_COMMAND);
      setCmdEdit(null);
      loadCommands();
    }
  }

  async function saveFile(e) {
    e?.preventDefault();
    setFileErr("");
    if (!fileDraft.title.trim() || !fileDraft.url.trim()) {
      setFileErr("Preencha o título e o link.");
      return;
    }
    const res = fileEdit
      ? await apiPatch(`/api/files/${fileEdit}`, fileDraft)
      : await apiPost("/api/files", fileDraft);
    if (!res.ok) setFileErr(res.error);
    else {
      setFileDraft(EMPTY_FILE);
      setFileEdit(null);
      loadFiles();
    }
  }

  if (loading) {
    return (
      <section className="px-6 md:px-10 pt-32 pb-24 max-w-[1240px] mx-auto">
        <div className="text-muted text-[14px]">Carregando...</div>
      </section>
    );
  }

  if (!user || !staff) {
    return (
      <section className="px-6 md:px-10 pt-32 pb-24 max-w-[1240px] mx-auto">
        <h1 className="font-display text-[30px] md:text-[42px] mb-4">Painel</h1>
        <div className="border border-line bg-bgAlt p-8 text-muted">
          {user ? (
            <>
              Seu cargo é <b className="text-ink">{user.role}</b> — o painel é só para
              Gerente, Subdono e Dono.
            </>
          ) : (
            <>Entre com sua conta para acessar o painel.</>
          )}
        </div>
        <Link
          href="/"
          className="inline-block mt-6 px-5 py-2.5 text-[13.5px] font-semibold border border-lineStrong hover:border-blue-bright hover:text-blue-glow transition-colors"
        >
          Voltar para o site
        </Link>
      </section>
    );
  }

  return (
    <section className="relative px-6 md:px-10 pt-32 pb-24 max-w-[1240px] mx-auto">
      <div className="flex justify-between items-end mb-8 gap-6 flex-wrap">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">
            管理 — PAINEL
          </div>
          <h1 className="font-display text-[30px] md:text-[42px]">Painel da equipe</h1>
        </div>
        <div className="text-[13px] text-muted">
          Você entrou como <b className="text-ink">{user.username}</b>{" "}
          <span className={`px-2 py-0.5 border ml-1 ${ROLE_BADGE[user.role] || ROLE_BADGE.Membro}`}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="flex gap-2.5 mb-8 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] border whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-blue-bright text-blue-bright"
                : "border-lineStrong text-muted hover:text-ink"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === "pedidos" && <OrdersTab />}

      {tab === "aprovacoes" && <ApprovalsTab />}

      {tab === "site" && (
        <form onSubmit={saveSite} className="max-w-[820px]">
          <h2 className="text-[18px] mb-5">Jogos e textos do site</h2>

          {siteErr && <Notice>{siteErr}</Notice>}
          {siteMsg && (
            <div className="mb-4 text-ok text-[12.5px] border border-[#4fd6a855] bg-[#4fd6a80d] px-4 py-2.5">
              {siteMsg}
            </div>
          )}

          {Object.entries(schema || {}).map(([key, meta]) => {
            const value = form[key] ?? "";
            const isList = meta.tipo === "lista";
            const display = isList
              ? String(value)
                  .replace(/^\[|\]$/g, "")
                  .split(",")
                  .map((s) => s.replace(/^"|"$/g, "").trim())
                  .filter(Boolean)
                  .join("\n")
              : value;

            return (
              <div key={key} className="mb-5">
                <label className="block text-[12.5px] text-muted mb-1.5">{meta.label}</label>
                {isList ? (
                  <textarea
                    rows={8}
                    value={display}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                  />
                ) : meta.tipo === "texto" && String(meta.padrao || "").length > 80 ? (
                  <textarea
                    rows={3}
                    value={value}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                  />
                )}
                <div className="text-[11.5px] text-muted mt-1.5">{meta.dica}</div>
              </div>
            );
          })}

          <button
            type="submit"
            disabled={savingSite}
            className="px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
          >
            {savingSite ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      )}

      {tab === "comandos" && (
        <div>
          <h2 className="text-[18px] mb-5">Comandos FiveM</h2>
          <Notice>{cmdErr}</Notice>

          <form onSubmit={saveCommand} className="bg-bgAlt border border-line p-5 mb-8 grid grid-cols-1 md:grid-cols-5 gap-3.5 items-end">
            <div>
              <label className="block text-[12.5px] text-muted mb-1.5">Comando</label>
              <input
                value={cmdDraft.name}
                onChange={(e) => setCmdDraft({ ...cmdDraft, name: e.target.value })}
                placeholder="/dv"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12.5px] text-muted mb-1.5">Descrição</label>
              <input
                value={cmdDraft.description}
                onChange={(e) => setCmdDraft({ ...cmdDraft, description: e.target.value })}
                placeholder="Deleta o veículo mais próximo"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-muted mb-1.5">Categoria</label>
              <input
                value={cmdDraft.category}
                onChange={(e) => setCmdDraft({ ...cmdDraft, category: e.target.value })}
                placeholder="geral"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
              >
                {cmdEdit ? "Salvar" : "Adicionar"}
              </button>
              {cmdEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setCmdEdit(null);
                    setCmdDraft(EMPTY_COMMAND);
                  }}
                  className="px-3 py-3 text-[13px] border border-lineStrong hover:border-blue-bright"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-col gap-2.5">
            {commands.length === 0 && (
              <div className="text-muted text-[13.5px] border border-line bg-bgAlt p-6">
                Nenhum comando cadastrado.
              </div>
            )}
            {commands.map((c) => (
              <div key={c.id} className="bg-bgAlt border border-line p-4 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <code className="text-[14px] text-blue-bright font-semibold">{c.name}</code>
                  <span className="text-[11px] text-muted ml-2.5 px-2 py-0.5 border border-lineStrong">
                    {c.category}
                  </span>
                  <div className="text-[13px] text-muted mt-1">{c.description}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setCmdEdit(c.id);
                      setCmdDraft({
                        name: c.name,
                        description: c.description,
                        category: c.category,
                        position: c.position ?? 0,
                      });
                    }}
                    className="px-3 py-1.5 text-[12.5px] border border-lineStrong hover:border-blue-bright hover:text-blue-glow"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      const res = await apiDelete(`/api/commands/${c.id}`);
                      if (!res.ok) setCmdErr(res.error);
                      else loadCommands();
                    }}
                    className="px-3 py-1.5 text-[12.5px] border border-lineStrong text-danger hover:border-danger"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "arquivos" && (
        <div>
          <h2 className="text-[18px] mb-5">Arquivos dos membros</h2>
          <Notice>{fileErr}</Notice>

          <form onSubmit={saveFile} className="bg-bgAlt border border-line p-5 mb-8 grid grid-cols-1 md:grid-cols-6 gap-3.5 items-end">
            <div className="md:col-span-2">
              <label className="block text-[12.5px] text-muted mb-1.5">Título</label>
              <input
                value={fileDraft.title}
                onChange={(e) => setFileDraft({ ...fileDraft, title: e.target.value })}
                placeholder="Citizen Kamikaze v3"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-muted mb-1.5">Tipo</label>
              <select
                value={fileDraft.type}
                onChange={(e) => setFileDraft({ ...fileDraft, type: e.target.value })}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              >
                {FILE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] text-muted mb-1.5">Versão</label>
              <input
                value={fileDraft.version || ""}
                onChange={(e) => setFileDraft({ ...fileDraft, version: e.target.value })}
                placeholder="v1.2"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div>
              <label className="block text-[12.5px] text-muted mb-1.5">Tamanho</label>
              <input
                value={fileDraft.size || ""}
                onChange={(e) => setFileDraft({ ...fileDraft, size: e.target.value })}
                placeholder="120 MB"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-3 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
            >
              {fileEdit ? "Salvar" : "Publicar"}
            </button>
            <div className="md:col-span-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Link (https://)</label>
              <input
                value={fileDraft.url}
                onChange={(e) => setFileDraft({ ...fileDraft, url: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12.5px] text-muted mb-1.5">Descrição</label>
              <input
                value={fileDraft.description || ""}
                onChange={(e) => setFileDraft({ ...fileDraft, description: e.target.value })}
                placeholder="O que mudou / como instalar"
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            {fileEdit && (
              <button
                type="button"
                onClick={() => {
                  setFileEdit(null);
                  setFileDraft(EMPTY_FILE);
                }}
                className="px-4 py-3 text-[13px] border border-lineStrong hover:border-blue-bright"
              >
                Cancelar
              </button>
            )}
          </form>

          <div className="flex flex-col gap-2.5">
            {files.length === 0 && (
              <div className="text-muted text-[13.5px] border border-line bg-bgAlt p-6">
                Nenhum arquivo publicado.
              </div>
            )}
            {files.map((f) => (
              <div key={f.id} className="bg-bgAlt border border-line p-4 flex justify-between items-center gap-4">
                <div className="min-w-0">
                  <b className="text-[15px]">{f.title}</b>
                  <span className="text-[11px] text-muted ml-2.5 px-2 py-0.5 border border-lineStrong">
                    {FILE_TYPES.find((t) => t.id === f.type)?.label || f.type}
                  </span>
                  <div className="text-[12px] text-muted mt-1 truncate">{f.url}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setFileEdit(f.id);
                      setFileDraft({
                        title: f.title,
                        type: f.type,
                        url: f.url,
                        description: f.description || "",
                        version: f.version || "",
                        size: f.size || "",
                      });
                    }}
                    className="px-3 py-1.5 text-[12.5px] border border-lineStrong hover:border-blue-bright hover:text-blue-glow"
                  >
                    Editar
                  </button>
                  <button
                    onClick={async () => {
                      const res = await apiDelete(`/api/files/${f.id}`);
                      if (!res.ok) setFileErr(res.error);
                      else loadFiles();
                    }}
                    className="px-3 py-1.5 text-[12.5px] border border-lineStrong text-danger hover:border-danger"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "membros" && <MembersTab currentUser={user} />}
    </section>
  );
}
