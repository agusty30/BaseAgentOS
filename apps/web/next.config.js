/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@baseagent/ui', '@baseagent/shared'],
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
