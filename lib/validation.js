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
