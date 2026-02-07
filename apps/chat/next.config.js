/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now default in Next.js 13.4+
  transpilePackages: [
    '@drishiq/contracts',
    '@drishiq/core',
    '@drishiq/policy',
    '@drishiq/ui',
    '@drishiq/llm',
    '@drishiq/worker'
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig



