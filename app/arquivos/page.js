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
import FilesBoard from "@/components/FilesBoard";

export const metadata = {
  title: "Arquivos — KAMIKAZE 神風",
  description: "Citizen, mod de som e arquivos do FiveM para membros da Kamikaze.",
};

export default function Page() {
  return (
    <main className="relative">
      <div className="bg-grid" />
      <Header />
      <FilesBoard />
      <Footer />
      <AuthModal />
    </main>
  );
}
