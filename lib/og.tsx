// The site's share images (Open Graph): a frame with the airmail stripe and
// the site's name, around what each page puts in it. app/opengraph-image.tsx
// is the site's own; app/jobs/[slug]/opengraph-image.tsx is each job's.
import { imageUrl } from "@nohead/sdk/images"
import { cacheLife } from "next/cache"
import { ImageResponse } from "next/og"
import { cacheAsContent } from "./content"

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

// A paper plane, airmail's own: the "Send Email" icon from Streamline's free
// Core set (https://www.streamlinehq.com/icons), under CC BY 4.0, drawn white.
const planeImage = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="white" fill-rule="evenodd" clip-rule="evenodd" d="M11.8214 0.0977331c0.2883 -0.1052509 0.6005 -0.1264465 0.9005 -0.0610159 0.3029 0.0660858 0.5805 0.2177638 0.7997 0.4370018 0.2192 0.219238 0.3709 0.496818 0.437 0.799741 0.0654 0.29992 0.0442 0.6122 -0.061 0.90043l-3.574 10.71201 -0.0002 0.0007c-0.0871 0.2634 -0.2404 0.5001 -0.4453 0.6873 -0.2043 0.1867 -0.45301 0.3178 -0.72238 0.381 -0.26942 0.0657 -0.55131 0.0601 -0.81798 -0.0161 -0.26643 -0.0761 -0.50848 -0.2201 -0.70245 -0.4179l-1.91734 -1.9086 -2.01406 1.0415c-0.15705 0.0812 -0.34532 0.0734 -0.49515 -0.0205 -0.14982 -0.0938 -0.23893 -0.2599 -0.23434 -0.4366l0.08257 -3.18376 7.04493 -5.11741c0.2793 -0.20286 0.3413 -0.59371 0.1384 -0.87298 -0.2029 -0.27928 -0.59371 -0.34122 -0.87299 -0.13836L2.20283 8.0884 0.473125 6.35869l-0.000058 -0.00005 -0.000126 -0.00013c-0.187323 -0.18719 -0.325225 -0.41797 -0.4013217 -0.67163 -0.07555546 -0.25185 -0.0878308 -0.51841 -0.0357814 -0.77609 0.0521166 -0.28151 0.1779581 -0.54421 0.3647391 -0.76128 0.18806 -0.21856 0.431073 -0.38293 0.703923 -0.47612l0.00337 -0.00115 0 0.00001L11.8214 0.0977331Z"/></svg>`
)}`

/**
 * The site's icon at `px` pixels: a paper plane on the site's blue, with
 * rounded corners unless the device rounds them itself (`square`). The plane
 * sits a little left of and below the middle, as its weight is up and to the
 * right.
 */
export function iconImage(px: number, { square = false } = {}) {
  const plane = px * 0.58
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
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={planeImage}
        width={plane}
        height={plane}
        alt=""
        style={{ marginLeft: -px * 0.025, marginTop: px * 0.015 }}
      />
    </div>,
    { width: px, height: px }
  )
}

/**
 * A logo from Nohead's image CDN as a PNG `px` pixels square, in a data URL
 * (next/og draws neither WebP nor every SVG), or null if it can't be had.
 */
export async function logoOf(src: string, px: number) {
  "use cache"
  cacheAsContent()
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
