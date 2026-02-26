const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {},
  serverExternalPackages: [],
  serverBodyParser: {
    sizeLimit: '50mb',
  },
};

module.exports = withPWA(nextConfig);
