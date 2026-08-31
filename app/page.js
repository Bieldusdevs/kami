/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DiscordNotice from "@/components/DiscordNotice";
import FarmSection from "@/components/FarmSection";
import ChatSection from "@/components/ChatSection";
import MembersSection from "@/components/MembersSection";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="relative">
      <div className="bg-grid" />
      <Header />
      <Hero />
      <DiscordNotice />
      <FarmSection />
      <ChatSection />
      <MembersSection />
      <Footer />
      <AuthModal />
    </main>
  );
}
