// The site's content, read from Nohead: the jobs, the companies hiring and
// the categories. Every page reads through these functions, so where the
// content comes from can change here alone.
//
// Each function is cached ('use cache') for an hour: pages are served from
// the cache, and a job past its closing date drops out within the hour,
// without anyone touching it.
//
// Server-side only: importing it from a client component fails the build, so
// the site's key never reaches the browser.
import "server-only"
import { Nohead } from "@nohead/sdk"
import { cacheLife } from "next/cache"

export interface Company {
  /** The company's record ID, which its jobs name. */
  id: string
  slug: string
  name: string
  /** The logo's image URL, or null when its asset has been deleted. */
  logo: string | null
  website: string
  about: string
}

export interface Category {
  /** The category's record ID, which its jobs name. */
  id: string
  slug: string
  name: string
  description: string
}

export interface Job {
  slug: string
  title: string
  company: Company
  category: Category
  type: string
  workplace: string
  location: string
  salary: { min: number; max: number; currency: string }
  postedOn: string
  closesOn: string
  summary: string
  /** The job's description, as HTML. */
  description: string
}

/** A job without its description, for lists. */
export type JobSummary = Omit<Job, "description">

/** What a job's row in a list shows: from the site's content, or from a search hit. */
export type JobRow = Pick<
  Job,
  "slug" | "title" | "type" | "workplace" | "location" | "salary" | "postedOn"
> & {
  company: Pick<Company, "name" | "logo">
}

/** A job as the home page's search board gets it: its row, its category's name for the filters, and its summary for the search. */
export type BoardJob = JobRow & Pick<Job, "summary"> & { category: Pick<Category, "name"> }

/** Only what the board uses: the page sends it to the browser. */
export function boardJobOf(job: Job): BoardJob {
  const { slug, title, type, workplace, location, salary, postedOn, summary, company, category } = job
  return {
    slug,
    title,
    type,
    workplace,
    location,
    salary,
    postedOn,
    summary,
    company: { name: company.name, logo: company.logo },
    category: { name: category.name },
  }
}

// The SDK reads NOHEAD_API_KEY: a key with "Published records only" on and
// the records:read and assets:read scopes.
// A list is read page by page as it's iterated, 100 records a request, and
// Array.fromAsync gathers every page.
const nohead = new Nohead()

/** The categories, in the order the site lists them. */
export async function getCategories(): Promise<Category[]> {
  "use cache"
  cacheLife("hours")
  const records = await Array.fromAsync(
    nohead.records.list<Omit<Category, "id">>("categories", { limit: 100, sort: "order" })
  )
  return records.map(({ id, data: { slug, name, description } }) => ({ id, slug, name, description }))
}

/** The companies, by name. */
export async function getCompanies(): Promise<Company[]> {
  "use cache"
  cacheLife("hours")
  const records = await Array.fromAsync(
    nohead.records.list<Omit<Company, "id" | "logo">>("companies", { limit: 100, expand: ["logo"] })
  )
  return records
    .map(({ id, data: { slug, name, website, about }, expanded }) => {
      // A deleted asset expands to null, while the company still names it.
      const logo = expanded?.logo as { image_url: string } | null | undefined
      return { id, slug, name, logo: logo?.image_url ?? null, website, about }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

interface JobData {
  title: string
  slug: string
  company: string
  category: string
  type: string
  workplace: string
  location: string
  salary_min: number
  salary_max: number
  salary_currency: string
  posted_on: string
  closes_on: string
  summary: string
  description: string
}

/** The open jobs (closing today or later), newest first. */
export async function getJobs(): Promise<Job[]> {
  "use cache"
  cacheLife("hours")
  const [categories, companies, records] = await Promise.all([
    getCategories(),
    getCompanies(),
    Array.fromAsync(
      nohead.records.list<JobData>("jobs", {
        limit: 100,
        filter: { closes_on: { gte: "today" } },
        sort: "-posted_on",
        rich_text: "html",
      })
    ),
  ])
  const companyById = new Map(companies.map((company) => [company.id, company]))
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  return records
    .flatMap(({ data }): Job[] => {
      // A job keeps naming its company and category after they're
      // unpublished or deleted; with nothing to show for them, it's left out.
      const company = companyById.get(data.company)
      const category = categoryById.get(data.category)
      if (!company || !category) return []
      return [
        {
          slug: data.slug,
          title: data.title,
          company,
          category,
          type: data.type,
          workplace: data.workplace,
          location: data.location,
          salary: { min: data.salary_min, max: data.salary_max, currency: data.salary_currency },
          postedOn: data.posted_on,
          closesOn: data.closes_on,
          summary: data.summary,
          description: data.description,
        },
      ]
    })
    .sort((a, b) => b.postedOn.localeCompare(a.postedOn) || a.title.localeCompare(b.title))
}

/** An open job, by its slug. */
export async function getJob(slug: string) {
  return (await getJobs()).find((job) => job.slug === slug)
}

/** A company, by its slug. */
export async function getCompany(slug: string) {
  return (await getCompanies()).find((company) => company.slug === slug)
}

/** A category, by its slug. */
export async function getCategory(slug: string) {
  return (await getCategories()).find((category) => category.slug === slug)
}
