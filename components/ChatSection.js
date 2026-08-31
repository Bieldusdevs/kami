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

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";

function initials(name) {
  return name?.slice(0, 2).toUpperCase() || "";
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatSection() {
  const { user } = useUser();
  const [messages, setMessages] = useState(null);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState("");
  const logRef = useRef(null);

  const loadChat = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { cache: "no-store" });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members", { cache: "no-store" });
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    loadChat();
    loadMembers();
    const t = setInterval(loadChat, 4000);
    return () => clearInterval(t);
  }, [loadChat, loadMembers]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const value = text.trim();
    if (!value || !user) return;
    setText("");
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      loadChat();
    } catch {
      // se falhar, o usuário pode tentar reenviar
    }
  }

  return (
    <section id="chat" className="relative px-6 md:px-10 py-24 max-w-[1240px] mx-auto">
      <div className="flex justify-between items-end mb-12 gap-6 flex-wrap">
        <div>
          <div className="font-display text-[13px] text-blue-bright tracking-[0.1em] mb-3">02 — 会話</div>
          <h2 className="font-display text-[30px] md:text-[42px]">Chat do Esquadrão</h2>
        </div>
        <p className="text-muted text-[14.5px] max-w-[360px] leading-relaxed">
          Conversa aberta entre todos os membros cadastrados da Kamikaze. Combine horários, farms e estratégias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-px bg-line border border-line h-auto md:h-[560px]">
        <div className="bg-bgAlt flex flex-col">
          <div ref={logRef} className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-4 max-h-[420px] md:max-h-none">
            {messages === null ? (
              <div className="text-muted text-[13.5px]">Carregando chat...</div>
            ) : messages.length === 0 ? (
              <div className="text-muted text-[13.5px]">Ainda não há mensagens. Diga olá para o esquadrão.</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="w-8 h-8 flex-none bg-gradient-to-br from-blue to-[#12244a] flex items-center justify-center text-xs font-bold">
                    {initials(m.username)}
                  </div>
                  <div>
                    <b className="text-[13.5px]">{m.username}</b>
                    <time className="text-[11px] text-muted ml-2">{fmtTime(m.createdAt)}</time>
                    <p className="text-sm text-[#cdd4e4] mt-0.5 leading-relaxed break-words">{m.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2.5 px-5.5 py-4.5 border-t border-line">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={!user}
              placeholder={user ? "Escreva para o esquadrão..." : "Entre na conta para conversar..."}
              className="flex-1 bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={!user}
              className="px-4 py-2 text-[12.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
        <div className="hidden md:block bg-bgAlt p-5.5 overflow-y-auto">
          <h4 className="text-[11.5px] text-muted tracking-[0.1em] mb-3.5">ONLINE NO CADASTRO</h4>
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 py-1.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-ok" />
              {m.username}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
