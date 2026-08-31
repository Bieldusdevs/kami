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

export const metadata = {
  title: "KAMIKAZE 神風 — Equipe",
  description:
    "Site oficial da equipe Kamikaze: entrega de farm, chat do esquadrão e membros.",
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
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
