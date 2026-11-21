import { colors, shareImage, size } from "@/lib/og"

export { size }
export const contentType = "image/png"
export const alt = "Elsewhere: remote jobs at small software companies"

const title = "Remote jobs at small software companies"
const line = "Engineering, design, product and more. Work from wherever home is this month."

/** The site's share image, for every page without its own. */
export default async function Image() {
  return shareImage(
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.8, maxWidth: 900 }}>
        {title}
      </div>
      <div style={{ marginTop: 28, fontSize: 34, color: colors.muted, maxWidth: 900 }}>{line}</div>
    </div>,
    { bold: title, regular: line }
  )
}
