import { iconImage } from "@/lib/og"

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

/** The site's icon, in browser tabs. */
export default function Icon() {
  return iconImage(size.width)
}
