/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usuário deve ter pelo menos 3 caracteres")
    .max(20, "Usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Use apenas letras, números e _"),
  email: z.string().trim().email("E-mail inválido").max(120),
  password: z
    .string()
    .min(6, "A senha precisa de pelo menos 6 caracteres")
    .max(72, "Senha muito longa"),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});

export const messageSchema = z.object({
  text: z.string().trim().min(1, "Mensagem vazia").max(500, "Mensagem muito longa"),
});

export const orderSchema = z.object({
  game: z.string().trim().min(1).max(60),
  item: z.string().trim().min(1, "Informe o item").max(80),
  qty: z.string().trim().min(1, "Informe a quantidade").max(40),
  notes: z.string().trim().max(300).optional().nullable(),
});

export const orderStatusSchema = z.object({
  status: z.enum(["pendente", "andamento", "concluido"]),
});

// Comandos do FiveM
export const commandSchema = z.object({
  name: z.string().trim().min(1, "Informe o comando").max(60, "Comando muito longo"),
  description: z
    .string()
    .trim()
    .min(1, "Descreva o comando")
    .max(300, "Descrição muito longa"),
  category: z.string().trim().min(1).max(40).default("geral"),
  position: z.number().int().min(-9999).max(9999).default(0),
});

// Arquivos para download (citizen, mod som, outros)
export const FILE_TYPES = ["citizen", "modsom", "outros"];

export const fileSchema = z.object({
  title: z.string().trim().min(1, "Informe o título").max(80, "Título muito longo"),
  type: z.enum(FILE_TYPES),
  url: z.string().trim().url("Informe uma URL válida (comece com https://)").max(600),
  description: z.string().trim().max(300).optional().nullable(),
  version: z.string().trim().max(40).optional().nullable(),
  size: z.string().trim().max(40).optional().nullable(),
});

// Solicitações para entrar na equipe (recrutamento)
export const applicationSchema = z.object({
  discord: z
    .string()
    .trim()
    .min(2, "Informe seu usuário do Discord")
    .max(40, "Usuário do Discord muito longo"),
  motivation: z
    .string()
    .trim()
    .min(10, "Conte um pouco mais sobre você (mínimo 10 caracteres)")
    .max(600, "Texto muito longo (máximo 600 caracteres)"),
  proofUrl: z
    .string()
    .trim()
    .url("Link do comprovante inválido")
    .max(600)
    .optional()
    .nullable(),
});

export const applicationStatusSchema = z.object({
  status: z.enum(["aprovado", "recusado"]),
});

// Configurações do site (painel admin)
export const settingsSchema = z.record(z.string().max(4000));

// Troca de cargo (só Dono)
export const ROLE_NAMES = ["Dono", "Subdono", "Gerente", "Membro"];

export const roleSchema = z.object({
  role: z.enum(ROLE_NAMES),
});

// As mensagens do zod vêm em inglês ("Required"). Traduzimos as mais comuns
// e citamos o campo para a pessoa saber exatamente o que corrigir.
export function zodMessage(error, fallback = "Dados inválidos.") {
  const issue = error?.issues?.[0];
  if (!issue) return fallback;
  const campo = issue.path?.join(".");
  if (issue.code === "invalid_type" && issue.received === "undefined") {
    return campo ? `Falta o campo "${campo}".` : "Faltam dados obrigatórios.";
  }
  if (issue.code === "invalid_enum_value") {
    const opcoes = (issue.options || []).join(", ");
    return `Campo "${campo}" com valor inválido.${opcoes ? ` Use um destes: ${opcoes}.` : ""}`;
  }
  return issue.message || fallback;
}
