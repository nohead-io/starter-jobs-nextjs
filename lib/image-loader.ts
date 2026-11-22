// Images are resized by Nohead's image CDN, not by Next.js: next/image asks it
// for each width, as WebP. Other images (the site's own) are left as they are.
export { nextImageLoader as default } from "@nohead/sdk/images"
