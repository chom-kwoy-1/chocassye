import type { NextConfig } from 'next'
import path from "node:path";

const nextConfig: NextConfig = {
  distDir: 'build', // Changes the build output directory to `build`
  turbopack: {
    root: path.resolve(__dirname),
  }
}

export default nextConfig
