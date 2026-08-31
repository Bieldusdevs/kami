/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { SettingsProvider } from "@/context/SettingsContext";

// URL pública do site: usada para gerar os links absolutos das meta tags
// (opengraph-image.jpg e icon.png são detectados automaticamente pelo Next
// dentro da pasta app/). Na Vercel a VERCEL_URL já vem pronta.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "KAMIKAZE 神風 — Equipe",
  description:
    "Site oficial da equipe Kamikaze: entrega de farm, chat do esquadrão e membros.",
  openGraph: {
    title: "KAMIKAZE 神風 — Equipe",
    description:
      "Site oficial da equipe Kamikaze: entrega de farm, chat do esquadrão e membros.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-ink font-body antialiased">
        <SettingsProvider>
          <UserProvider>{children}</UserProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
