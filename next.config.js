/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  swcMinify: true,
}

module.exports = nextConfig