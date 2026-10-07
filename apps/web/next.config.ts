import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // Static export (Cloudflare Pages): no cacheComponents / partialPrefetching —
  // both are runtime caching features and partialPrefetching requires cacheComponents.
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
