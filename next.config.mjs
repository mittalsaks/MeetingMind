/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ]
  },
}

export default nextConfig
