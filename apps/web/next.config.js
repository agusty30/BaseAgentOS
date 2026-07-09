/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@baseagent/ui', '@baseagent/shared'],
  output: 'standalone',
};

module.exports = nextConfig;
