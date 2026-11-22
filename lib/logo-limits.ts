// What a posted job's new company logo may be, where the content model
// doesn't say: its logo field takes any image of any size.
// Checked in the browser (components/post-job-form.tsx) and on the server,
// before anything is uploaded (app/post/actions.ts).

/**
 * The kinds of image a logo can be. Nohead's image CDN serves an SVG with its
 * scripts taken out, so a visitor's SVG is as safe to show as a PNG.
 */
export const LOGO_TYPES = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"]

/** How large a logo can be, in bytes. */
export const LOGO_BYTES = 2_000_000

/** What's wrong with a logo, in the form's words (after "Logo"), or nothing. */
export function logoProblem(file: { type: string; size: number }) {
  if (!LOGO_TYPES.includes(file.type)) return "must be an SVG, PNG, JPEG or WebP image"
  if (file.size > LOGO_BYTES) return "must be 2 MB or smaller"
}
