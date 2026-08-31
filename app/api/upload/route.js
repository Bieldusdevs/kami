/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Upload de IMAGENS para qualquer usuário logado (comprovantes de farm,
// print de solicitação de entrada etc.). Diferente de /api/admin/upload,
// que aceita arquivos da equipe para a área de downloads.
//
// Regras:
//   - precisa estar logado;
//   - só imagens (png, jpg, gif, webp) de até 4,5 MB;
//   - usa o Vercel Blob (BLOB_READ_WRITE_TOKEN) — sem ele, responde 501 com
//     mensagem amigável e o formulário segue funcionando sem o anexo.
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { rateLimit, getClientKey } from "@/lib/rateLimit";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4.5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export async function POST(req) {
  try {
    const { user, response } = await requireUser();
    if (response) return response;

    const clientKey = getClientKey(req);
    const limited = rateLimit(`upload:${user.id}:${clientKey}`, { limit: 10, windowMs: 60_000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitos envios em pouco tempo. Aguarde um minuto.", code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Upload de imagens desativado no servidor (ative o Vercel Blob em Storage → Blob). O formulário funciona normalmente sem o anexo.",
          code: "UPLOAD_DISABLED",
        },
        { status: 501 }
      );
    }

    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Envie o arquivo como multipart/form-data.", code: "BAD_BODY" },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "Nenhum arquivo recebido.", code: "NO_FILE" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Envie uma imagem (png, jpg, gif ou webp).", code: "BAD_TYPE" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error: "Imagem grande demais (limite ~4,5 MB). Reduza o tamanho e tente de novo.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    let put;
    try {
      ({ put } = await import("@vercel/blob"));
    } catch {
      return NextResponse.json(
        {
          error: "Pacote @vercel/blob não instalado neste deploy. Rode `npm install` novamente.",
          code: "UPLOAD_UNAVAILABLE",
        },
        { status: 501 }
      );
    }

    const safeName = String(file.name || "imagem").replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `kamikaze/uploads/${user.id}/${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(
      { url: blob.url, pathname: blob.pathname, size: file.size },
      { status: 201 }
    );
  } catch (err) {
    const { status, json } = errorResponse(err, "POST /api/upload");
    return NextResponse.json(json, { status });
  }
}
