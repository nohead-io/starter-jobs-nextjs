/**
 * The site's address, for links read away from it (feeds, the sitemap, share
 * images): SITE_URL, or on Vercel the project's production domain. Without a
 * trailing slash, as the feeds add paths to it.
 */
export const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "")
