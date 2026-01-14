/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "zznzssvlcelqzsnyatfc.supabase.co",
      },
    ],
  },
  
webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    // Esto desactiva la optimización que está fallando en el build de Cloudflare
    config.optimization.minimize = false; 
    return config;
  },
};
export default nextConfig;
