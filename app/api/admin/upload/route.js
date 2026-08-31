/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██║██║ ██╔╝╚█████╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
// Upload de arquivos (citizen, mod som) usando o Vercel Blob.
//
// Funciona SOMENTE se o storage estiver ligado no projeto:
//   Vercel → Storage → Create → Blob → e a variável
//   BLOB_READ_WRITE_TOKEN entra sozinha nas Environment Variables.
// Sem essa variável a rota responde 501 e o painel continua funcionando
// apenas com links (Google Drive, Discord, MediaFire...).
//
// Limite: as funções da Vercel aceitam até ~4,5 MB por requisição.
// Para arquivos maiores, use a opção de colar o link.
import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 4.5 * 1024 * 1024;

export async function POST(req) {
  try {
    const { response } = await requireStaff();
    if (response) return response;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Upload desativado: ative o Vercel Blob no projeto (Storage → Blob) para liberar o envio de arquivos. Enquanto isso, use a opção de colar o link.",
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
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          error:
            "Arquivo grande demais para upload direto (limite ~4,5 MB). Suba no Drive/Discord e cole o link.",
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    let put;
    try {
      ({ put } = await import("@vercel/blob"));
    } catch (err) {
      return NextResponse.json(
        {
          error:
            "Pacote @vercel/blob não instalado neste deploy. Rode `npm install` novamente ou use links.",
          code: "UPLOAD_UNAVAILABLE",
        },
        { status: 501 }
      );
    }

    const folder = (formData.get("type") || "outros").toString().replace(/[^a-z0-9_-]/gi, "");
    const safeName = String(file.name || "arquivo").replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `kamikaze/${folder || "outros"}/${Date.now()}-${safeName}`;

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
    const { status, json } = errorResponse(err, "POST /api/admin/upload");
    return NextResponse.json(json, { status });
  }
}
