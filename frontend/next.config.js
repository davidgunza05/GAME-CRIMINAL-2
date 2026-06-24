/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  },
  // Logs de compilação limpos
  logging: {
    fetches: { fullUrl: false },
  },
  // Prefetch agressivo em dev para links navegarem instantaneamente
  experimental: {
    optimisticClientCache: true,
  },
}

module.exports = nextConfig
