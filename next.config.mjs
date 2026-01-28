/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ESTA ES LA CORRECCIÓN: Desactiva el procesamiento de Vercel para no agotar el límite
    unoptimized: true, 
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "zznzssvlcelqzsnyatfc.supabase.co",
      },
      // AGREGAR ESTO: Permite cargar el icono de Google
      {
        protocol: "https",
        hostname: "www.google.com",
      },
    ],
  },
};

export default nextConfig;