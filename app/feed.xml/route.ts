import { feedOf, rss } from "@/lib/feed"

/** Every open job, as RSS. */
export async function GET() {
  return rss(await feedOf())
}
