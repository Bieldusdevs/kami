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

import { useState } from "react";
import { useUser } from "@/context/UserContext";

export default function AuthModal() {
  const { authOpen, authTab, closeAuth, login, register } = useUser();
  const [tab, setTab] = useState(authTab);

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [cadUser, setCadUser] = useState("");
  const [cadEmail, setCadEmail] = useState("");
  const [cadPass, setCadPass] = useState("");
  const [cadErr, setCadErr] = useState("");
  const [cadBusy, setCadBusy] = useState(false);

  if (authOpen && tab !== authTab) setTab(authTab);
  if (!authOpen) return null;

  async function handleLogin() {
    setLoginErr("");
    if (!loginUser || !loginPass) {
      setLoginErr("Preencha usuário e senha.");
      return;
    }
    setLoginBusy(true);
    const res = await login(loginUser, loginPass);
    setLoginBusy(false);
    if (!res.ok) setLoginErr(res.error);
  }

  async function handleCadastro() {
    setCadErr("");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cadUser)) {
      setCadErr("Usuário deve ter 3-20 caracteres (letras, números, _).");
      return;
    }
    if (!cadEmail.includes("@")) {
      setCadErr("E-mail inválido.");
      return;
    }
    if (cadPass.length < 6) {
      setCadErr("A senha precisa de pelo menos 6 caracteres.");
      return;
    }
    setCadBusy(true);
    const res = await register(cadUser, cadEmail, cadPass);
    setCadBusy(false);
    if (!res.ok) setCadErr(res.error);
  }

  return (
    <div
      className="fixed inset-0 bg-[rgba(3,5,9,0.78)] backdrop-blur-sm z-[1000] flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && closeAuth()}
    >
      <div className="bg-bgAlt border border-lineStrong w-[400px] max-w-full p-9 relative">
        <button
          onClick={closeAuth}
          className="absolute top-4 right-4 text-xl text-muted hover:text-ink"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="flex border border-lineStrong mb-6">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-2.5 text-[13px] ${tab === "login" ? "bg-blue text-white" : "text-muted"}`}
          >
            Entrar
          </button>
          <button
            onClick={() => setTab("cadastro")}
            className={`flex-1 py-2.5 text-[13px] ${tab === "cadastro" ? "bg-blue text-white" : "text-muted"}`}
          >
            Cadastrar
          </button>
        </div>

        {tab === "login" ? (
          <div>
            <h3 className="text-[22px] mb-1.5">Bem-vindo de volta</h3>
            <div className="text-[13px] text-muted mb-6">Entre com seu usuário da Kamikaze.</div>

            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Usuário</label>
              <input
                type="text"
                placeholder="seu_usuario"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loginBusy}
              className="w-full px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
            >
              {loginBusy ? "Entrando..." : "Entrar"}
            </button>
            {loginErr && <div className="text-danger text-[12.5px] mt-2.5">{loginErr}</div>}
          </div>
        ) : (
          <div>
            <h3 className="text-[22px] mb-1.5">Junte-se à equipe</h3>
            <div className="text-[13px] text-muted mb-6">Crie sua conta de membro da Kamikaze.</div>

            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Usuário</label>
              <input
                type="text"
                placeholder="seu_usuario"
                value={cadUser}
                onChange={(e) => setCadUser(e.target.value)}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">E-mail</label>
              <input
                type="email"
                placeholder="voce@email.com"
                value={cadEmail}
                onChange={(e) => setCadEmail(e.target.value)}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Senha</label>
              <input
                type="password"
                placeholder="mínimo 6 caracteres"
                value={cadPass}
                onChange={(e) => setCadPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCadastro()}
                className="w-full bg-bgAlt border border-lineStrong px-3.5 py-3 text-sm outline-none focus:border-blue-bright"
              />
            </div>
            <button
              onClick={handleCadastro}
              disabled={cadBusy}
              className="w-full px-5 py-2.5 text-[13.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white disabled:opacity-50"
            >
              {cadBusy ? "Criando..." : "Criar conta"}
            </button>
            {cadErr && <div className="text-danger text-[12.5px] mt-2.5">{cadErr}</div>}
            <div className="text-[11px] text-[#54607a] mt-4.5 leading-relaxed border-t border-line pt-4">
              🔒 Sua senha é protegida com hash bcrypt (12 rounds) antes de
              ser salva no banco — nunca em texto puro. A sessão usa cookie
              httpOnly, o que impede que scripts no navegador leiam o token.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
