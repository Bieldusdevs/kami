import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { errorResponse } from "@/lib/apiErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/discord/callback";

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code) {
    return NextResponse.json(
      { error: "Código de autorização não fornecido." },
      { status: 400 }
    );
  }

  // Exchange code for token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      scope: "identify email",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    return NextResponse.json({ error: "Erro ao trocar código por token", details: err }, { status: 400 });
  }

  const { access_token } = await tokenRes.json();

  // Fetch user info
  const userInfoRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userInfoRes.ok) {
    return NextResponse.json({ error: "Não foi possível obter informações do usuário Discord" }, { status: 400 });
  }

  const discordUser = await userInfoRes.json(); // { id, username, discriminator, avatar, ...

  // Try to find or create a user linked by discordId
  let user = await prisma.user.findFirst({ where: { discordId: discordUser.id } });

  if (!user) {
    // Try to find by username+discriminator to avoid duplicates
    const tag = discordUser.username + "#" + (discordUser.discriminator || "0");
    user = await prisma.user.findFirst({ where: { username: tag } });
    if (user) {
      // Link discordId
      user = await prisma.user.update({
        where: { id: user.id },
        data: { discordId: discordUser.id },
      });
    } else {
      // Create new user with a default role; passwordHash will be empty, they'll login via Discord only
      user = await prisma.user.create({
        data: {
          username: tag,
          usernameLower: tag.toLowerCase(),
          email: "", // may be empty; we could ask for email if needed
          passwordHash: "", // no password
          role: "Membro",
          discordId: discordUser.id,
        },
      });
    }
  } else if (user.discordId !== discordUser.id) {
    // If the discordId is already linked to another username, we could error or just ignore.
    // For now, we just proceed with the found user.
  }

  // Sign in session
  // We need a request object with proper headers; here we approximate with a minimal object.
  // In a real deployment, the route would receive the original req, but for this sandbox we
  // just set the cookie with a generic request-like object.
  setSessionCookie(user.id, { headers: { "x-forwarded-proto": "http" } });

  // Redirect to the home page indicating Discord connection succeeded
  const redirect = NextResponse.redirect(new URL("/", req.url));
  redirect.cookies.set("discord_connected", "1", {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  return redirect;
}
