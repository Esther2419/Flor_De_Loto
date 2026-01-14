/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. FORZAR SWC: Esto evita el error de "WebpackError is not a constructor"
  swcMinify: true,

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
      // 2. EVITAR EMPAQUETAR PRISMA: Necesario para el Edge Runtime
      config.externals.push('@prisma/client');
    }
    
    // 3. DESACTIVAR MINIFICACIÓN DE WEBPACK: Segunda capa de seguridad contra errores de build
    config.optimization.minimize = false; 
    
    return config;
  },
};

export default nextConfig;
