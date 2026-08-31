/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ConfigError } from "./apiErrors";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "kamikaze_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;
const DEV_SECRET = "kamikaze-dev-secret-troque-pelo-JWT_SECRET-em-producao";

let warnedAboutDevSecret = false;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim()) return secret.trim();

  if (process.env.NODE_ENV === "production") {
    // Em produção nunca inventamos um segredo: sem ele a sessão não é segura.
    throw new ConfigError(
      "JWT_SECRET não configurado. Defina essa variável de ambiente.",
      "JWT_SECRET_MISSING"
    );
  }

  // Em desenvolvimento deixamos o site funcionar, mas avisamos no terminal.
  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn(
      "[kamikaze] JWT_SECRET não definido — usando um segredo temporário de desenvolvimento. " +
        "Crie um .env com JWT_SECRET (openssl rand -base64 48)."
    );
  }
  return DEV_SECRET;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signSession(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: SEVEN_DAYS });
}

export function verifySession(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

// O cookie só pode ser "secure" se o site estiver em HTTPS — em HTTP o
// navegador descarta o cookie e a pessoa "entra" mas continua deslogada.
// Aqui olhamos o protocolo real da requisição (x-forwarded-proto), com a
// opção de forçar via KAMI_COOKIE_SECURE=0/1.
function isSecureRequest(req) {
  if (process.env.KAMI_COOKIE_SECURE === "0") return false;
  if (process.env.KAMI_COOKIE_SECURE === "1") return true;

  const proto =
    req?.headers?.get?.("x-forwarded-proto") ||
    req?.headers?.get?.("x-forwarded-protocol");
  if (proto) return proto.split(",")[0].trim() === "https";

  return process.env.NODE_ENV === "production";
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite: "lax",
    path: "/",
  };
}

// Grava o cookie de sessão httpOnly + sameSite (+ secure em HTTPS).
export function setSessionCookie(userId, req) {
  const token = signSession({ sub: userId });
  cookies().set(COOKIE_NAME, token, {
    ...cookieOptions(req),
    maxAge: SEVEN_DAYS,
  });
}

export function clearSessionCookie(req) {
  cookies().set(COOKIE_NAME, "", {
    ...cookieOptions(req),
    maxAge: 0,
  });
}

// Lê o usuário autenticado a partir do cookie de sessão.
// Retorna null se não houver sessão válida.
export function getSessionUserId() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload?.sub) return null;
  return payload.sub;
}
