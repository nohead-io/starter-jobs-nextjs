// Serves the seed's images (seed/images), such as the companies' logos.
import { readFile } from "node:fs/promises"
import { extname, join, normalize } from "node:path"

const types: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
}

const images = join(process.cwd(), "seed", "images")

export async function GET(_request: Request, { params }: RouteContext<"/seed-images/[...path]">) {
  const path = normalize(join(images, ...(await params).path))
  const type = types[extname(path)]
  if (!path.startsWith(images + "/") || !type) return new Response("Not found", { status: 404 })
  try {
    return new Response(await readFile(path), { headers: { "Content-Type": type } })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
