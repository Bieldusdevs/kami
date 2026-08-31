import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/discord/callback";

export async function GET(req) {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return NextResponse.json(
      { error: "Configuração do Discord incompleta (clientId/clientSecret/redirectUri)." },
      { status: 500 }
    );
  }

  const scope = "identify email";
  const state = Buffer.from(JSON.stringify({}).).toString("base64"); // simples, pode ser melhorado
  const authUrl = new URL("https://discord.com/api/oauth2/authorize");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
