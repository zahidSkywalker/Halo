/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'halo-media-bucket.s3.amazonaws.com',
      'via.placeholder.com',
      'images.unsplash.com',
      'picsum.photos'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  // Enable SWC minification
  swcMinify: true,
  // Enable compression
  compress: true,
  // Enable powered by header
  poweredByHeader: false,
  // Enable strict mode
  reactStrictMode: true,
  // Enable TypeScript checking
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable ESLint checking
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;