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
      // Esto evita que Next.js intente cargar el motor de Prisma 
      // durante la fase de "Collecting page data"
      config.externals.push('@prisma/client');
    }
    config.resolve.fallback = { crypto: false };
    return config;
  },
};

export default nextConfig;