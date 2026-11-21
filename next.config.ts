import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Links are checked against the app's routes: a mistyped href fails the type check, not a visitor.
  typedRoutes: true,
  partialPrefetching: true,

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
