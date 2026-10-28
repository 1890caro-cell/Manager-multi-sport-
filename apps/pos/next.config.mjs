/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@sports/contracts', '@sports/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
      {
        source: '/bridge-api/:path*',
        destination: 'http://localhost:8080/api/v1/bridge/:path*',
      },
    ];
  },
};

export default nextConfig;
