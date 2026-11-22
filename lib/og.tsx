// The site's share images (Open Graph): a frame with the airmail stripe and
// the site's name, around what each page puts in it. app/opengraph-image.tsx
// is the site's own; app/jobs/[slug]/opengraph-image.tsx is each job's.
import { imageUrl } from "@nohead/sdk/images"
import { cacheLife } from "next/cache"
import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }

// The site's colours (app/globals.css), as next/og takes them.
export const colors = { red: "#d73337", blue: "#204ec3", ink: "#151f32", muted: "#5a6475" }

/**
 * Schibsted Grotesk, the site's typeface, at a weight, cut down to the
 * characters `text` uses. next/og needs the font's file itself, as TrueType,
 * which Google Fonts serves; it's fetched once, when the image is built.
 */
export async function font(weight: 400 | 700, text: string) {
  "use cache"
  cacheLife("max")
  const query = `family=Schibsted+Grotesk:wght@${weight}&text=${encodeURIComponent(text)}`
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text()
  const url = /src: url\((.+?)\) format\('truetype'\)/.exec(css)?.[1]
  if (!url) throw new Error("Schibsted Grotesk couldn't be loaded from Google Fonts.")
  return (await fetch(url)).arrayBuffer()
}

/**
 * The site's icon at `px` pixels: an E on the site's blue, with rounded
 * corners unless the device rounds them itself (`square`).
 */
export async function iconImage(px: number, { square = false } = {}) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        borderRadius: square ? 0 : px * 0.22,
        background: colors.blue,
        color: "white",
        fontFamily: "Schibsted Grotesk",
        fontSize: px * 0.7,
        fontWeight: 700,
      }}
    >
      E
    </div>,
    { width: px, height: px, fonts: [{ name: "Schibsted Grotesk", data: await font(700, "E"), weight: 700 }] }
  )
}

/**
 * A logo from Nohead's image CDN as a PNG `px` pixels square, in a data URL
 * (next/og draws neither WebP nor every SVG), or null if it can't be had.
 */
export async function logoOf(src: string, px: number) {
  "use cache"
  cacheLife("hours")
  const response = await fetch(imageUrl(src, { width: px, height: px, format: "png" }))
  if (!response.ok) return null
  return `data:image/png;base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`
}

const name = "Elsewhere"

// The stripe of an airmail envelope, as along the top of every page, at
// twice its size: an SVG pattern, which next/og draws with crisp edges.
const stripe = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="16"><defs><pattern id="s" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="80" fill="${colors.red}"/><rect x="40" width="24" height="80" fill="${colors.blue}"/></pattern></defs><rect width="${size.width}" height="16" fill="url(#s)"/></svg>`
)}`

/** A share image: the airmail stripe and the site's name at the top, and `children` at the foot. */
export async function shareImage(children: React.ReactNode, text: { bold: string; regular: string }) {
  const [bold, regular] = await Promise.all([font(700, text.bold + name), font(400, text.regular)])
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "white",
        color: colors.ink,
        fontFamily: "Schibsted Grotesk",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stripe} width={size.width} height={16} alt="" />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "52px 80px 72px" }}>
        <div style={{ display: "flex", fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>{name}</div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Schibsted Grotesk", data: bold, weight: 700, style: "normal" },
        { name: "Schibsted Grotesk", data: regular, weight: 400, style: "normal" },
      ],
    }
  )
}
