import type {NextConfig} from 'next'
import path from "node:path";

const nextConfig: NextConfig = {
  distDir: 'build', // Changes the build output directory to `build`
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*", // get everything after /api/
        destination: `http://localhost:5000/api/:path*`, // send it to your API
      },
    ];
  }
}

export default nextConfig;
