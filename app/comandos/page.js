/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CommandsBoard from "@/components/CommandsBoard";

export const metadata = {
  title: "Comandos FiveM — KAMIKAZE 神風",
  description: "Lista de comandos do servidor FiveM da Kamikaze, editada pela gerência.",
};

export default function Page() {
  return (
    <main className="relative">
      <div className="bg-grid" />
      <Header />
      <CommandsBoard />
      <Footer />
      <AuthModal />
    </main>
  );
}
