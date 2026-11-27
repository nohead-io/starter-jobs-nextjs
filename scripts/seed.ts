// Uploads the demo content in seed/ to a Nohead project and publishes it:
// categories, companies (with their logos) and jobs.
//
// Push the schema first, then run it once with a key that can write records
// and assets (records:read, records:write, assets:write):
//
//   pnpm nohead schema push --yes
//   NOHEAD_API_KEY=... pnpm seed
//
// It creates what is missing and leaves records that already exist alone,
// matched by slug, so running it again is safe and never overwrites edits.
import { openAsBlob } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { basename, join } from "node:path"
import { Nohead } from "@nohead/sdk"
import { parse } from "yaml"
import { movedForward } from "./dates.ts"

// The SDK reads NOHEAD_API_KEY (and NOHEAD_API_URL) itself.
const nohead = new Nohead()
const seed = join(import.meta.dirname, "..", "seed")

/** A Markdown file's YAML front matter and its body. */
async function markdown(path: string) {
  const text = await readFile(path, "utf8")
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text)
  if (!match) throw new Error(`${path} has no front matter`)
  return { data: parse(match[1]!), body: match[2]!.trim() }
}

/** The record being built's uploads, removed again if it isn't created. */
let uploads: string[] = []

/** Uploads an image a seed file names (its path relative to seed/), with its alt text. */
async function upload({ image, alt = "" }: { image: string; alt?: string }) {
  const path = join(seed, image)
  const asset = await nohead.assets.upload(await openAsBlob(path), { filename: basename(path), alt })
  uploads.push(asset.id)
  return asset.id
}

/**
 * Creates each record the collection doesn't have yet (by slug), published.
 * Returns every slug's record ID, new and old.
 */
async function sync<T>(
  collection: string,
  items: T[],
  slugOf: (item: T) => string,
  dataOf: (item: T, index: number) => Promise<Record<string, unknown>>
) {
  const ids = new Map<string, string>()
  for await (const record of nohead.records.list(collection)) {
    ids.set(String(record.data.slug), record.id)
  }
  let created = 0
  for (const [index, item] of items.entries()) {
    const slug = slugOf(item)
    if (ids.has(slug)) continue
    uploads = []
    let record
    try {
      record = await nohead.records.create(collection, { data: await dataOf(item, index), publish: true })
    } catch (error) {
      // Don't leave its images behind; the next run uploads them again.
      await Promise.all(uploads.map((id) => nohead.assets.delete(id).catch(() => {})))
      throw error
    }
    ids.set(slug, record.id)
    created++
    console.log(`  + ${collection}/${slug}`)
  }
  console.log(`${collection}: ${created} created, ${items.length - created} already there`)
  return ids
}

/** The record ID of the entry a seed file names by slug. */
function idOf(ids: Map<string, string>, slug: string, what: string) {
  const id = ids.get(slug)
  if (!id) throw new Error(`${what} "${slug}" isn't in seed/.`)
  return id
}

interface Category {
  name: string
  slug: string
  description: string
}

const categories = await sync(
  "categories",
  parse(await readFile(join(seed, "categories.yaml"), "utf8")) as Category[],
  (category) => category.slug,
  async (category, i) => ({ ...category, order: i + 1 })
)

interface Company {
  name: string
  slug: string
  logo: { image: string; alt?: string }
  website: string
  about: string
}

const companies = await sync(
  "companies",
  parse(await readFile(join(seed, "companies.yaml"), "utf8")) as Company[],
  (company) => company.slug,
  async (company) => ({ ...company, logo: await upload(company.logo) })
)

const jobFiles = (await readdir(join(seed, "jobs"))).filter((file) => file.endsWith(".md")).sort()
const jobs = await Promise.all(jobFiles.map((file) => markdown(join(seed, "jobs", file))))
const moved = movedForward(jobs.map(({ data }) => data.posted_on))
await sync(
  "jobs",
  jobs,
  ({ data }) => data.slug,
  async ({ data, body }) => ({
    ...data,
    posted_on: moved(data.posted_on),
    closes_on: moved(data.closes_on),
    company: idOf(companies, data.company, `Job ${data.slug}'s company`),
    category: idOf(categories, data.category, `Job ${data.slug}'s category`),
    description: body,
  })
)
