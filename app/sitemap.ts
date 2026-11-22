import type { MetadataRoute } from "next"
import { getCategories, getCompanies, getJobs } from "@/lib/content"
import { siteUrl } from "@/lib/site"

/**
 * Every page search engines should find, at /sitemap.xml: the board's own
 * pages, each open job, and each company and category. A job's page is
 * dated by the day it was posted; it leaves the sitemap once it closes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, companies, categories] = await Promise.all([getJobs(), getCompanies(), getCategories()])
  const url = (path: string) => new URL(path, siteUrl).href
  return [
    { url: url("/") },
    { url: url("/companies") },
    { url: url("/about") },
    { url: url("/post") },
    ...jobs.map((job) => ({ url: url(`/jobs/${job.slug}`), lastModified: job.postedOn })),
    ...companies.map((company) => ({ url: url(`/companies/${company.slug}`) })),
    ...categories.map((category) => ({ url: url(`/categories/${category.slug}`) })),
  ]
}
