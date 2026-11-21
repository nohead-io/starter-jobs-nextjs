import { getCategories } from "@/lib/content"
import { paramsOf } from "@/lib/static-params"
import { feedOf, rss } from "@/lib/feed"

export async function generateStaticParams() {
  return paramsOf(await getCategories())
}

/** A category's open jobs, as RSS. */
export async function GET(_request: Request, { params }: RouteContext<"/categories/[slug]/feed.xml">) {
  return rss(await feedOf((await params).slug))
}
