/**
 * The site's address, for links read away from it (feeds, the sitemap, share
 * images), from SITE_URL. Without a trailing slash, as the feeds add paths to it.
 */
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "")
