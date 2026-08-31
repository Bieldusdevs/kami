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

import Logo from "./Logo";
import { useUser } from "@/context/UserContext";

function initials(name) {
  return name?.slice(0, 2).toUpperCase() || "";
}

export default function Header() {
  const { user, loading, openAuth, logout } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-10 py-4 bg-bg/72 backdrop-blur-xl border-b border-line">
      <div className="flex items-center gap-3">
        <Logo />
        <div className="font-display font-black text-[19px] tracking-wide leading-none">
          KAMIKAZE
          <small className="block font-jp font-normal text-[10px] tracking-[0.3em] text-blue-bright mt-1">
            神風 — 侍 チーム
          </small>
        </div>
      </div>

      <nav className="hidden md:flex gap-8">
        <a href="#inicio" className="text-sm text-muted hover:text-ink transition-colors">Início</a>
        <a href="#farm" className="text-sm text-muted hover:text-ink transition-colors">Farm</a>
        <a href="#chat" className="text-sm text-muted hover:text-ink transition-colors">Chat</a>
        <a href="#membros" className="text-sm text-muted hover:text-ink transition-colors">Membros</a>
      </nav>

      <div className="flex items-center gap-3">
        {loading ? null : user ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-[30px] h-[30px] bg-gradient-to-br from-blue to-[#12244a] border border-lineStrong flex items-center justify-center font-bold text-[13px]">
                {initials(user.username)}
              </div>
              <span>{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="px-3.5 py-[7px] text-[12.5px] font-semibold border border-lineStrong hover:border-blue-bright hover:text-blue-glow transition-colors"
            >
              Sair
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => openAuth("login")}
              className="px-3.5 py-[7px] text-[12.5px] font-semibold border border-lineStrong hover:border-blue-bright hover:text-blue-glow transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => openAuth("cadastro")}
              className="px-3.5 py-[7px] text-[12.5px] font-semibold bg-blue border border-blue hover:bg-blue-bright hover:border-blue-bright hover:text-bg transition-colors text-white"
            >
              Cadastrar
            </button>
          </>
        )}
      </div>
    </header>
  );
}
