import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Links are checked against the app's routes: a mistyped href fails the type check, not a visitor.
  typedRoutes: true,
  partialPrefetching: true,
  images: {
    // Images from Nohead's image CDN, which resizes them: lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
