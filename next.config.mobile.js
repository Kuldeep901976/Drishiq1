const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNavCaching: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static exports for mobile apps
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // We handle i18n through middleware and components
  // since Next.js i18n is not compatible with static export
};

module.exports = withPWA(nextConfig); 