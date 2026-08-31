/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Deixa o site abrir em qualquer endereço de preview (Vercel, Codespaces,
  // sandbox...) sem o aviso de "cross origin" do Next.
  allowedDevOrigins: ["*.e2b.app", "*.vercel.app", "*.github.dev", "localhost", "127.0.0.1"],
};

export default nextConfig;
