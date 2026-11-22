import { Feed } from "feed"
import { cacheAsContent, getCategory, getJobs } from "./content"
import { dateOf, placeOf, salaryOf } from "./format"
import { siteUrl } from "./site"

/** Text made safe to put in HTML. */
function escape(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

/**
 * An RSS feed of the open jobs, newest first: every one, or a category's (by
 * its slug), or null for a category that isn't there. Written by the feed
 * package, which can write the same items as Atom or JSON Feed too. Feed
 * readers follow it, and newsletter tools can email its new jobs to
 * subscribers.
 *
 * Cached as the content is, so a feed is built ahead of time like the pages,
 * not for every reader that asks: also the time it was built, which the feed
 * package would otherwise read at each request.
 */
export async function feedOf(slug?: string): Promise<string | null> {
  "use cache"
  cacheAsContent()
  const [jobs, category] = await Promise.all([getJobs(), slug ? getCategory(slug) : undefined])
  if (slug && !category) return null
  const feed = new Feed({
    title: category ? `${category.name} jobs · Elsewhere` : "Elsewhere",
    description: category ? category.description : "Remote jobs at small software companies.",
    link: siteUrl,
    language: "en",
    feedLinks: { rss: `${siteUrl}${category ? `/categories/${category.slug}` : ""}/feed.xml` },
  })
  for (const job of jobs) {
    if (category && job.category.slug !== category.slug) continue
    const facts = `${placeOf(job)}. ${salaryOf(job.salary)} a year, ${job.type.toLowerCase()}. Apply by ${dateOf(job.closesOn)}.`
    feed.addItem({
      title: `${job.title} at ${job.company.name}`,
      // Also the item's ID (its guid) in the feed.
      link: `${siteUrl}/jobs/${job.slug}`,
      date: new Date(job.postedOn),
      category: [{ name: job.category.name }],
      // HTML, made of text: the job's summary and its facts.
      description: `<p>${escape(job.summary)}</p><p>${escape(facts)}</p>`,
    })
  }
  return feed.rss2()
}

/** A feed as the response to a request for it: Not found for a category that isn't there. */
export function rss(feed: string | null) {
  if (feed === null) return new Response("Not found", { status: 404 })
  return new Response(feed, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })
}
