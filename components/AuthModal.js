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
  const [discordErr, setDiscordErr] = useState("");
  const [discordOk, setDiscordOk] = useState("");

  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [cadUser, setCadUser] = useState("");
  const [cadEmail, setCadEmail] = useState("");
  const [cadPass, setCadPass] = useState("");
  const [cadErr, setCadErr] = useState("");
  const [cadBusy, setCadBusy] = useState(false);

  // Tabs: "login", "cadastro", "discord"
  if (authOpen && tab !== authTab) setTab(authTab);
  if (!authOpen) return null;

  // Read the ?discord_connected=1 query param from the callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("discord_connected") === "1") {
      setDiscordOk("Conta do Discord vinculada com sucesso!");
      // Remove the param so it doesn't persist
      const newUrl = new URL(window.location.href);
      newUrl.search.delete("discord_connected");
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []);

  async function handleLogin() {
    setLoginErr("");
    const usuario = loginUser.trim();
    if (!usuario || !loginPass) {
      setLoginErr("Preencha usuário e senha.");
      return;
    }
    setLoginBusy(true);
    try {
      const res = await login(usuario, loginPass);
      if (!res || !res.ok) setLoginErr(res?.error || "Não foi possível entrar.");
    } catch {
      setLoginErr("Erro inesperado no navegador. Recarregue a página e tente de novo.");
    } finally {
      // Sempre libera o botão, mesmo se algo der errado — antes ele ficava
      // preso em "Entrando...".
      setLoginBusy(false);
    }
  }

  async function handleCadastro() {
    setCadErr("");
    const usuario = cadUser.trim();
    const email = cadEmail.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(usuario)) {
      setCadErr("Usuário deve ter 3-20 caracteres (letras, números, _).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setCadErr("E-mail inválido.");
      return;
    }
    if (cadPass.length < 6) {
      setCadErr("A senha precisa de pelo menos 6 caracteres.");
      return;
    }
    setCadBusy(true);
    try {
      const res = await register(usuario, email, cadPass);
      if (!res || !res.ok) setCadErr(res?.error || "Não foi possível criar a conta.");
    } catch {
      setCadErr("Erro inesperado no navegador. Recarregue a página e tente de novo.");
    } finally {
      setCadBusy(false);
    }
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
          <button
            onClick={() => setTab("discord")}
            className={`flex-1 py-2.5 text-[13px] ${tab === "discord" ? "bg-green-600 text-white" : "text-muted"}`}
          >
            Conectar Discord
          </button>
        </div>

        {tab === "login" ? (
          <div>
            <h3 className="text-[22px] mb-1.5">Bem-vindo de volta</h3>
            <div className="text-[13px] text-muted mb-6">
              Entre com o seu usuário ou e-mail da Kamikaze.
            </div>

            <div className="mb-4">
              <label className="block text-[12.5px] text-muted mb-1.5">Usuário</label>
              <input
                type="text"
                placeholder="seu_usuario ou voce@email.com"
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
            {loginErr && (
              <div
                role="alert"
                className="text-danger text-[12.5px] mt-2.5 leading-relaxed break-words"
              >
                {loginErr}
              </div>
            )}
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
            {cadErr && (
              <div
                role="alert"
                className="text-danger text-[12.5px] mt-2.5 leading-relaxed break-words"
              >
                {cadErr}
              </div>
            )}
            <div className="text-[11px] text-[#54607a] mt-4 leading-relaxed border-t border-line pt-4">
              🔒 Sua senha é protegida com hash bcrypt (12 rounds) antes de
              ser salva no banco — nunca em texto puro. A sessão usa cookie
              httpOnly, o que impede que scripts no navegador leiam o token.
            </div>
          </div>
        )}
        {tab === "discord" ? (
          <div>
            <h3 className="text-[22px] mb-1.5">Conectar Discord</h3>
            <div className="text-[13px] text-muted mb-6">
              Autorize este site a acessar seu perfil do Discord para vinculá‑lo à sua conta Kamikaze.
            </div>
            <button
              onClick={() => {
                // Redireciona para o endpoint de início de OAuth do Discord
                window.location.href = "/api/auth/discord/start";
              }}
              className="w-full px-5 py-2.5 text-[13.5px] font-semibold bg-green-600 border border-green-600 hover:bg-green-500 hover:border-green-500 transition-colors text-white"
            >
              Iniciar conexão com Discord
            </button>
            {discordErr && (
              <div
                role="alert"
                className="text-danger text-[12.5px] mt-2.5 leading-relaxed break-words"
              >
                {discordErr}
              </div>
            )}
            {discordOk && (
              <div
                role="alert"
                className="text-ok text-[12.5px] mt-2.5 leading-relaxed break-words"
              >
                {discordOk}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
