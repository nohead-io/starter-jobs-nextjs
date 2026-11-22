// The site's content, read from Nohead: the jobs, the companies hiring and
// the categories. Every page reads through these functions, so where the
// content comes from can change here alone.
//
// Each function is cached ('use cache') until content is published, which
// the webhook in app/webhooks/nohead says, or until the day changes, when a
// job past its closing date drops out without anyone touching it:
// cacheAsContent(), below. Pages are served from the cache.
//
// Server-side only: importing it from a client component fails the build, so
// the site's key never reaches the browser.
import "server-only"
import { Nohead } from "@nohead/sdk"
import { cacheLife, cacheTag } from "next/cache"
import { newestFirst } from "./format"

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
  /** The job's record ID, which an application names. */
  id: string
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

/** A job as the home page's search board gets it: its row, and its category's name for the filters. */
export type BoardJob = JobRow & { category: Pick<Category, "name"> }

/** Only what the board uses: the page sends it to the browser. */
export function boardJobOf(job: Job): BoardJob {
  const { slug, title, type, workplace, location, salary, postedOn, company, category } = job
  return {
    slug,
    title,
    type,
    workplace,
    location,
    salary,
    postedOn,
    company: { name: company.name, logo: company.logo },
    category: { name: category.name },
  }
}

/**
 * Caches a 'use cache' function's result as the site's content: under the tag
 * "nohead", which the webhook clears when content is published, and until
 * midnight (UTC), when jobs past their closing date leave the board, as
 * nothing is published then. The first visit after midnight gets the day
 * before's page while a new one is built.
 */
export function cacheAsContent() {
  const day = 86_400
  const untilMidnight = day - (Math.floor(Date.now() / 1000) % day)
  cacheLife({ revalidate: untilMidnight, expire: untilMidnight + day })
  cacheTag("nohead")
}

// The SDK reads NOHEAD_API_KEY: a key with "Published records only" on and
// the records:read, assets:read and schema:read scopes.
// A list is read page by page as it's iterated, 100 records a request, and
// Array.fromAsync gathers every page.
const nohead = new Nohead()

/** The categories, in the order the site lists them. */
export async function getCategories(): Promise<Category[]> {
  "use cache"
  cacheAsContent()
  const records = await Array.fromAsync(
    nohead.records.list<Omit<Category, "id">>("categories", { limit: 100, sort: "order" })
  )
  return records.map(({ id, data: { slug, name, description } }) => ({ id, slug, name, description }))
}

/** The companies, by name. */
export async function getCompanies(): Promise<Company[]> {
  "use cache"
  cacheAsContent()
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
  cacheAsContent()
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
    .flatMap(({ id, data }): Job[] => {
      // A job keeps naming its company and category after they're
      // unpublished or deleted; with nothing to show for them, it's left out.
      const company = companyById.get(data.company)
      const category = categoryById.get(data.category)
      if (!company || !category) return []
      return [
        {
          id,
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
    .sort(newestFirst)
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

/** What the browser needs to search the jobs, and the filter that keeps out what the site doesn't list. */
export interface Search {
  token: string
  index: string
  filter: string
}

/**
 * The jobs' public search: the search token (public, so it can go in the
 * page), the jobs' search index name (read with the site's key, which needs
 * the schema:read scope too), and a filter for the jobs the site lists: still
 * open, by the same day as the rest of the site, with a published
 * company and category.
 */
export async function getSearch(): Promise<Search> {
  "use cache"
  cacheAsContent()
  const token = process.env.NOHEAD_SEARCH_TOKEN
  if (!token) throw new Error("NOHEAD_SEARCH_TOKEN isn't set: create a search token in the Nohead web app.")
  const { index } = await nohead.collections.searchIndex.get("jobs")
  // Dates are Unix seconds in search: today's, at midnight UTC.
  const today = Math.floor(Date.now() / 86_400_000) * 86_400
  return {
    token,
    index,
    filter: `data.closes_on >= ${today} AND expanded.company.data.name EXISTS AND expanded.category.data.name EXISTS`,
  }
}

/** What the form that posts a job offers for the jobs' choice fields: the options the content model allows. */
export interface JobChoices {
  types: string[]
  workplaces: string[]
  currencies: string[]
}

/**
 * The jobs' choice fields' options, read from the content model (with the
 * site's key, which has the schema:read scope), so an option added in Nohead
 * shows in the form without changing the site.
 */
export async function getJobChoices(): Promise<JobChoices> {
  "use cache"
  cacheAsContent()
  const { fields } = await nohead.collections.get("jobs")
  const options = (key: string) => {
    const field = fields.find((field) => field.key === key)
    return field?.type === "enum" ? field.configuration.options : []
  }
  return { types: options("type"), workplaces: options("workplace"), currencies: options("salary_currency") }
}
