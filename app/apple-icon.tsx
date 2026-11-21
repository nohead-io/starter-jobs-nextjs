import { iconImage } from "@/lib/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** The site's icon on home screens, square: iOS rounds its corners. */
export default function AppleIcon() {
  return iconImage(size.width, { square: true })
}
