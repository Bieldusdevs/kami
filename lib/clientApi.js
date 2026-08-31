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

// Cliente HTTP do painel: nunca estoura exceção, sempre devolve
// { ok, data, error } — assim a interface mostra a mensagem certa.
async function parse(res) {
  const text = await res.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function fallbackMessage(res) {
  if (res.status === 401) return "Você precisa estar logado.";
  if (res.status === 403) return "Seu cargo não tem permissão para isso.";
  if (res.status === 404) return "Não encontrado.";
  if (res.status === 429) return "Muitas tentativas. Aguarde um pouco.";
  if (res.status >= 500) return "O servidor falhou. Tente novamente em instantes.";
  return "Não foi possível concluir.";
}

export async function apiRequest(path, { method = "GET", body, formData } = {}) {
  try {
    const options = { method };
    if (formData) {
      options.body = formData;
    } else if (body !== undefined) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const res = await fetch(path, options);
    const data = await parse(res);

    if (!res.ok) {
      return { ok: false, error: data.error || fallbackMessage(res), code: data.code, status: res.status };
    }
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, error: "Falha de conexão. Verifique sua internet.", code: "NETWORK" };
  }
}

export const apiGet = (path) => apiRequest(path);
export const apiPost = (path, body) => apiRequest(path, { method: "POST", body });
export const apiPut = (path, body) => apiRequest(path, { method: "PUT", body });
export const apiPatch = (path, body) => apiRequest(path, { method: "PATCH", body });
export const apiDelete = (path) => apiRequest(path, { method: "DELETE" });
