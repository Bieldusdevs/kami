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

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const UserContext = createContext(null);

// Nunca deixa o app quebrar quando o servidor responde HTML/erro em vez de
// JSON (era exatamente isso que travava o botão "Entrando...").
async function readBody(res) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function friendlyError(res) {
  if (res.status >= 500) {
    return "O servidor falhou ao processar. Tente novamente em alguns instantes.";
  }
  if (res.status === 429) {
    return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  }
  if (res.status === 404) {
    return "Endpoint não encontrado (404). Verifique se o deploy está atualizado.";
  }
  return "Não foi possível concluir. Tente novamente.";
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await readBody(res);
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(username, password) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await readBody(res);
      if (!res.ok) {
        return { ok: false, error: data.error || friendlyError(res), code: data.code };
      }
      setUser(data.user);
      setAuthOpen(false);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error:
          "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.",
        code: "NETWORK",
      };
    }
  }

  async function register(username, email, password) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await readBody(res);
      if (!res.ok) {
        return { ok: false, error: data.error || friendlyError(res), code: data.code };
      }
      setUser(data.user);
      setAuthOpen(false);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error:
          "Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.",
        code: "NETWORK",
      };
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Mesmo se a chamada falhar, encerramos a sessão no navegador.
    }
    setUser(null);
  }

  function openAuth(tab = "login") {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
        authOpen,
        authTab,
        openAuth,
        closeAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser precisa estar dentro de UserProvider");
  return ctx;
}
