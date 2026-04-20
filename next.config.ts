import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ['crypto'],
};

export default nextConfig;
