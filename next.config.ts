import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/ticketswift-al241.firebasestorage.app/o/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ["https://9004-firebase-studio-1747914073735.cluster-ancjwrkgr5dvux4qug5rbzyc2y.cloudworkstations.dev"],
  },
  webpack: (config, { isServer }) => {
    // 處理 handlebars 和 genkit 的警告
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    
    // 忽略特定模組的警告
    config.ignoreWarnings = [
      {
        module: /node_modules\/handlebars/,
      },
      {
        module: /node_modules\/dotprompt/,
      },
      {
        module: /node_modules\/@genkit-ai/,
      },
    ];
    
    return config;
  },
};

export default nextConfig;