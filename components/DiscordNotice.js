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

// Aviso de recrutamento + Discord na página inicial:
//   - convida para o servidor (link vem da configuração "site.discord");
//   - recebe solicitações para entrar na equipe (com comprovante opcional
//     enviado via /api/upload);
//   - mostra o status da solicitação de quem já enviou.

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";

const STATUS_STYLE = {
  pendente: "text-[#ffc857] border-[#ffc85755]",
  aprovado: "text-ok border-[#4fd6a855]",
  recusado: "text-danger border-danger/40",
};

const STATUS_LABEL = {
  pendente: "Aguardando a gerência",
  aprovado: "Aprovado! Bem-vindo à Kamikaze",
  recusado: "Recusado — tente novamente quando quiser",
};

export default function DiscordNotice() {
  const { user, openAuth } = useUser();
  const { settings } = useSettings();
  const discordUrl = (settings?.["site.discord"] || "").trim();

  const [mine, setMine] = useState(null); // última solicitação do usuário logado
  const [form, setForm] = useState({ discord: "", motivation: "" });
  const [proof, setProof] = useState(null); // File selecionado
  const [proofUrl, setProofUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const loadMine = useCallback(async () => {
    if (!user) {
      setMine(null);
      return;
    }
    try {
      const res = await fetch("/api/applications", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setMine((data.applications || [])[0] || null);
    } catch {
      // sem solicitação carregada — o formulário segue utilizável
    }
  }, [user]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  async function uploadProof(file) {
    // Anexar comprovante é opcional: se o upload falhar (ex.: Blob
    // desativado), enviamos a solicitação mesmo assim.
    if (!file) return "";
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) return data.url;
      setErr(`Não consegui anexar o comprovante (${data.error || "upload indisponível"}). A solicitação será enviada sem ele.`);
      return "";
    } catch {
      setErr("Falha ao anexar o comprovante. A solicitação será enviada sem ele.");
      return "";
    }
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!form.discord.trim() || form.motivation.trim().length < 10) {
      setErr("Preencha seu Discord e conte um pouco mais na motivação (mínimo 10 caracteres).");
      return;
    }

    setSending(true);
    try {
      const url = await uploadProof(proof);
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discord: form.discord,
          motivation: form.motivation,
          proofUrl: url || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Erro ao enviar a solicitação.");
        return;
      }
      setOk("Solicitação enviada! A gerência vai analisar e responder.");
      setForm({ discord: "", motivation: "" });
      setProof(null);
      setProofUrl("");
      loadMine();
    } catch {
      setErr("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const hasPending = mine?.status === "pendente";

  return (
    <section id="recrutamento" className="relative px-6 md:px-10 py-16 max-w-[1240px] mx-auto">
      <div className="border border-lineStrong bg-panel p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">
            採用 — RECRUTAMENTO
          </div>
          <h2 className="font-display text-[26px] md:text-[34px] mb-4">
            Quer entrar na Kamikaze?
          </h2>
          <p className="text-muted text-[14px] leading-relaxed mb-6">
            Envie sua solicitação com seu usuário do Discord. A gerência analisa e
            responde pelo painel — e avisa a equipe no servidor.
          </p>
          {discordUrl ? (
            <a
              href={discordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-5 py-2.5 text-[13.5px] font-semibold bg-[#5865F2] border border-[#5865F2] hover:bg-[#6d78ff] transition-colors text-white"
            >
              🎮 Entrar no Discord
            </a>
          ) : (
            <p className="text-[12.5px] text-muted">
              (O link do Discord aparece aqui quando a gerência configurá-lo no painel.)
            </p>
          )}
        </div>

        <div>
          {!user ? (
            <div className="flex flex-col items-start gap-4 py-8 text-muted">
              <span className="font-display text-[13px] text-blue-bright tracking-[0.1em]">
                ログインが必要です
              </span>
              <p className="text-[13.5px]">Entre na sua conta para enviar a solicitação.</p>
              <button
                onClick={() => openAuth("login")}
                className="px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
              >
                Entrar para continuar
              </button>
            </div>
          ) : hasPending ? (
            <div className="flex flex-col justify-center h-full gap-3 py-6">
              <div className={`text-[13px] px-4 py-3 border ${STATUS_STYLE.pendente}`}>
                ⏳ Sua solicitação está {STATUS_LABEL.pendente.toLowerCase()}.
              </div>
              <p className="text-[12.5px] text-muted">
                Assim que a gerência decidir, o status muda aqui e você é avisado no Discord.
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {mine && (
                <div className={`text-[12.5px] px-4 py-2.5 border mb-4 ${STATUS_STYLE[mine.status] || ""}`}>
                  Última solicitação: {STATUS_LABEL[mine.status] || mine.status}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[12.5px] text-muted mb-1.5">Seu usuário no Discord</label>
                <input
                  type="text"
                  placeholder="ex: novak"
                  value={form.discord}
                  onChange={(e) => setForm({ ...form, discord: e.target.value })}
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[12.5px] text-muted mb-1.5">
                  Por que quer entrar? (motivação)
                </label>
                <textarea
                  rows={3}
                  placeholder="Conte sua experiência, disponibilidade de horário..."
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
                />
              </div>

              <div className="mb-4">
                <label className="block text-[12.5px] text-muted mb-1.5">
                  Comprovante (opcional — print de stats, histórico etc.)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={(e) => setProof(e.target.files?.[0] || null)}
                  className="w-full text-[12.5px] text-muted file:mr-3 file:px-3.5 file:py-2 file:text-[12.5px] file:bg-bgAlt file:border file:border-lineStrong file:text-ink hover:file:border-blue-bright"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
              >
                {sending ? "Enviando..." : "Enviar solicitação"}
              </button>

              {err && <div className="text-danger text-[12.5px] mt-2.5">{err}</div>}
              {ok && <div className="text-ok text-[12.5px] mt-2.5">{ok}</div>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
