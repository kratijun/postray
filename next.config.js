/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  // PWA-Konfiguration
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    // Für Leaflet im Client
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  // Optimierungen für Production
  compress: true,
  poweredByHeader: false,
  // Bilder optimieren
  images: {
    unoptimized: false,
  },
};

module.exports = nextConfig;

