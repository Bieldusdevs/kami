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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import AnnouncementBar from "./AnnouncementBar";
import { useUser } from "@/context/UserContext";
import { useSettings } from "@/context/SettingsContext";
import { ROLE_BADGE, isStaff } from "@/lib/roles";

function initials(name) {
  return name?.slice(0, 2).toUpperCase() || "";
}

const NAV = [
  { label: "Início", href: "/#inicio" },
  { label: "Farm", href: "/#farm" },
  { label: "Arquivos", href: "/arquivos" },
  { label: "Comandos", href: "/comandos" },
  { label: "Membros", href: "/#membros" },
];

export default function Header() {
  const { user, loading, openAuth, logout } = useUser();
  const { settings } = useSettings();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const discord = (settings["site.discord"] || "").trim();

  // Fecha o menu mobile ao trocar de página
  useEffect(() => {
    setOpen(false);
  }, [router]);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-bg/72 backdrop-blur-xl border-b border-line">
      <AnnouncementBar />

      <div className="flex items-center justify-between px-6 md:px-10 py-4 gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <div className="font-display font-black text-[19px] tracking-wide leading-none">
            KAMIKAZE
            <small className="block font-jp font-normal text-[10px] tracking-[0.3em] text-blue-bright mt-1">
              神風 — 侍 チーム
            </small>
          </div>
        </Link>

        <nav className="hidden lg:flex gap-7">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {isStaff(user?.role) && (
            <Link href="/admin" className="text-sm text-blue-bright hover:text-blue-glow transition-colors">
              Painel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {discord && (
            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex px-3.5 py-[7px] text-[12.5px] font-semibold border border-lineStrong hover:border-blue-bright hover:text-blue-glow transition-colors"
            >
              Discord
            </a>
          )}

          {loading ? null : user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-[30px] h-[30px] bg-gradient-to-br from-blue to-[#12244a] border border-lineStrong flex items-center justify-center font-bold text-[13px]">
                  {initials(user.username)}
                </div>
                <span className="hidden sm:inline">
                  {user.username}
                  <small
                    className={`block text-[10px] px-1.5 py-[1px] border w-fit mt-[1px] ${
                      ROLE_BADGE[user.role] || ROLE_BADGE.Membro
                    }`}
                  >
                    {user.role}
                  </small>
                </span>
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

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden px-2.5 py-1.5 text-sm border border-lineStrong"
            aria-label="Abrir menu"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-line px-6 md:px-10 py-3 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted hover:text-ink py-1.5"
            >
              {item.label}
            </Link>
          ))}
          {isStaff(user?.role) && (
            <Link href="/admin" className="text-sm text-blue-bright py-1.5">
              Painel
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
