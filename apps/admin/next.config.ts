import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Source-only workspace packages must be compiled by the app.
  transpilePackages: ['@haizo/ui', '@haizo/types'],
  // Standalone output keeps the VPS footprint small — two Next apps, Express and
  // Postgres share one KVM2 box.
  output: 'standalone',
  poweredByHeader: false,
};

export default config;
