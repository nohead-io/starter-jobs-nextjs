// The site's content, read from the seed files in seed/: the jobs, the
// companies hiring and the categories. Every page reads through these functions, so where the
// content comes from can change here alone.
//
// Each function is cached ('use cache') for an hour: pages are served from
// the cache, and a job past its closing date drops out within the hour,
// without anyone touching it.
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { marked } from "marked"
import { cacheLife } from "next/cache"
import { parse } from "yaml"

export interface Company {
  slug: string
  name: string
  /** The logo's image URL, or null when there's none. */
  logo: string | null
  website: string
  about: string
}

export interface Category {
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

/** What a job's row in a list shows. */
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

const seed = join(process.cwd(), "seed")

/** A Markdown file's YAML front matter and its body. */
async function markdown(path: string) {
  const text = await readFile(path, "utf8")
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text)
  if (!match) throw new Error(`${path} has no front matter`)
  return { data: parse(match[1]!), body: match[2]!.trim() }
}

/** The categories, in the order the site lists them. */
export async function getCategories(): Promise<Category[]> {
  "use cache"
  cacheLife("hours")
  const categories: Category[] = parse(await readFile(join(seed, "categories.yaml"), "utf8"))
  return categories.map(({ slug, name, description }) => ({ slug, name, description }))
}

/** The companies, by name. */
export async function getCompanies(): Promise<Company[]> {
  "use cache"
  cacheLife("hours")
  type SeedCompany = Omit<Company, "logo"> & { logo: { image: string } }
  const companies: SeedCompany[] = parse(await readFile(join(seed, "companies.yaml"), "utf8"))
  return companies
    .map(({ slug, name, logo, website, about }) => ({
      slug,
      name,
      // Served from seed/images by app/seed-images.
      logo: `/seed-images/${logo.image.replace(/^images\//, "")}`,
      website,
      about,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * The seed's dates, moved forward together so its newest job was posted
 * today: the demo jobs are open, and recent, whenever the site is built.
 */
function movedForward(postedOn: string[]) {
  const day = 24 * 60 * 60 * 1000
  const newest = Math.max(...postedOn.map((date) => Date.parse(date)))
  const shift = Math.max(0, Math.floor((Date.now() - newest) / day)) * day
  return (date: string) => new Date(Date.parse(date) + shift).toISOString().slice(0, 10)
}

/** The open jobs (closing today or later), newest first. */
export async function getJobs(): Promise<Job[]> {
  "use cache"
  cacheLife("hours")
  const folder = join(seed, "jobs")
  const [categories, companies, files] = await Promise.all([getCategories(), getCompanies(), readdir(folder)])
  const companyBySlug = new Map(companies.map((company) => [company.slug, company]))
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]))
  // Today's date in UTC, as YYYY-MM-DD.
  const today = new Date().toISOString().slice(0, 10)
  const entries = await Promise.all(
    files.filter((file) => file.endsWith(".md")).map((file) => markdown(join(folder, file)))
  )
  const moved = movedForward(entries.map(({ data }) => data.posted_on))
  const jobs = await Promise.all(
    entries.map(async ({ data, body }): Promise<Job> => ({
      slug: data.slug,
      title: data.title,
      company: companyBySlug.get(data.company)!,
      category: categoryBySlug.get(data.category)!,
      type: data.type,
      workplace: data.workplace,
      location: data.location,
      salary: { min: data.salary_min, max: data.salary_max, currency: data.salary_currency },
      postedOn: moved(data.posted_on),
      closesOn: moved(data.closes_on),
      summary: data.summary,
      description: await marked.parse(body),
    }))
  )
  return jobs
    .filter((job) => job.closesOn >= today)
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
