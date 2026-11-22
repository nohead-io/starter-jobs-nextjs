"use server"

import { ValidationError } from "@nohead/sdk"
import slugify from "@sindresorhus/slugify"
import { REFUSAL, verdictOf } from "@/lib/bot-checks"
import { getCategories, getCompanies } from "@/lib/content"
import { formKeyClient } from "@/lib/form-key"
import { logoProblem } from "@/lib/logo-limits"

/** The fields a visitor fills in, by the name of their input. The server action picks these, and nothing else, from the form. */
const fields = [
  "title",
  "category",
  "type",
  "workplace",
  "location",
  "salary_min",
  "salary_max",
  "salary_currency",
  "closes_on",
  "summary",
  "description",
  "company",
  "company_name",
  "company_website",
  "company_about",
  "company_logo",
  "name",
  "email",
  "note",
] as const
export type PostField = (typeof fields)[number]

export interface PostState {
  sent: boolean
  /** What was entered, to fill the form in again after an error when it's sent without JavaScript (all but the logo, which a form can't). */
  values?: Partial<Record<PostField, string>>
  /** A problem per field, in the API's words. */
  errors?: Partial<Record<PostField, string>>
  /** A problem with the whole form. */
  error?: string
  /** The job, once it's waiting for review. */
  posted?: { title: string; company: string }
}

/**
 * Posts a job for review: creates the job, unpublished, and with it a new
 * company and its logo if the job isn't for one already on the board, and a
 * posting that says who sent it. Nothing goes live until someone publishes
 * it in Nohead. The key that creates them (NOHEAD_FORM_KEY, with only the
 * records:write and assets:write scopes) stays on the server.
 */
export async function post(_previous: PostState, form: FormData): Promise<PostState> {
  const values = Object.fromEntries(
    fields
      .filter((name) => name !== "company_logo")
      .map((name) => [name, String(form.get(name) ?? "").trim()])
  ) as Record<Exclude<PostField, "company_logo">, string>
  const failed = (errors: PostState["errors"]) => ({ sent: false, values, errors })

  const verdict = await verdictOf(form)
  if (verdict === "bot") return { sent: true }
  if (verdict === "refused") return { sent: false, values, error: REFUSAL }

  const nohead = formKeyClient()
  if (!nohead) return { sent: false, values, error: "Jobs can't be posted at the moment." }

  // What the API can't check: choices from the site's own lists, the logo
  // before it's uploaded, and dates and figures that only make sense
  // together. The content model limits the rest, such as the description's
  // length, and the API's errors name the field.
  const today = new Date().toISOString().slice(0, 10)
  const [categories, companies] = await Promise.all([getCategories(), getCompanies()])
  const category = categories.find(({ slug }) => slug === values.category)
  const existing = companies.find(({ slug }) => slug === values.company)
  // The form says "+new" for a company to add: no slug has a "+".
  const isNew = values.company === "+new"
  const logo = form.get("company_logo")
  const errors: PostState["errors"] = {}
  if (!category) errors.category = "is required"
  if (!existing && !isNew) errors.company = "is required"
  if (isNew && (!(logo instanceof File) || logo.size === 0)) errors.company_logo = "is required"
  else if (isNew && logoProblem(logo as File)) errors.company_logo = logoProblem(logo as File)
  // The site lists jobs closing today or later, by UTC's calendar: an earlier
  // date would never show. The form sets the same minimum.
  if (values.closes_on && values.closes_on < today) errors.closes_on = "must be today (in UTC) or later"
  // Both are required; the API says so for one left empty.
  if (values.salary_min && values.salary_max && Number(values.salary_min) > Number(values.salary_max))
    errors.salary_max = "must be at least the salary from"
  if (Object.keys(errors).length > 0 || !category) return failed(errors)

  // What's been created, undone if a later step fails, so a failed try leaves nothing behind.
  const undo: (() => Promise<unknown>)[] = []
  // Which record a validation error is about: its fields are named apart in the form.
  let step: "company" | "job" | "posting" = "company"
  try {
    // A new company is created first, with its logo, unpublished like the job.
    const createCompany = async () => {
      const asset = await nohead.assets.upload(logo as File, { alt: "" })
      undo.push(() => nohead.assets.delete(asset.id))
      const record = await nohead.records.create("companies", {
        data: {
          name: values.company_name,
          slug: slugify(values.company_name),
          logo: asset.id,
          website: values.company_website,
          about: values.company_about,
        },
      })
      undo.push(() => nohead.records.delete(record.id))
      return { id: record.id, name: values.company_name }
    }
    const company = existing ? { id: existing.id, name: existing.name } : await createCompany()

    step = "job"
    const job = await nohead.records.create("jobs", {
      data: {
        title: values.title,
        slug: slugify(`${values.title} ${company.name}`),
        company: company.id,
        category: category.id,
        type: values.type,
        workplace: values.workplace,
        location: values.location,
        salary_min: values.salary_min ? Number(values.salary_min) : undefined,
        salary_max: values.salary_max ? Number(values.salary_max) : undefined,
        salary_currency: values.salary_currency,
        // Today; whoever publishes it can change it to the day it goes live.
        posted_on: today,
        closes_on: values.closes_on,
        summary: values.summary,
        // Rich text, written as Markdown.
        description: values.description,
      },
    })
    undo.push(() => nohead.records.delete(job.id))

    step = "posting"
    await nohead.records.create("postings", {
      data: { job: job.id, name: values.name, email: values.email, note: values.note || undefined },
    })
    return { sent: true, posted: { title: values.title, company: company.name } }
  } catch (error) {
    // All at once: none of them depends on another being gone first.
    await Promise.all(undo.map((undoing) => undoing().catch(() => {})))
    if (error instanceof ValidationError) {
      const errors = errorsOf(step, error.details)
      if (Object.keys(errors).length > 0) return failed(errors)
    }
    console.error(error)
    return { sent: false, values, error: "Your job couldn't be posted. Reload the page and try again." }
  }
}

/** A step's validation errors, by the form's field names. */
function errorsOf(
  step: "company" | "job" | "posting",
  details: { field?: string; code?: string; message: string }[]
) {
  const errors: PostState["errors"] = {}
  for (const { field, code, message } of details) {
    if (!field) continue
    // The addresses are made from what was typed, so their problems are the names'.
    if (step === "company" && field === "slug")
      errors.company_name =
        code === "taken"
          ? "is already on the board, or waiting for review: choose it from the list if it's there"
          : "needs some letters or numbers"
    else if (step === "job" && field === "slug")
      errors.title = code === "taken" ? "is already posted for this company" : "needs some letters or numbers"
    else {
      const name = step === "company" ? `company_${field}` : field
      if ((fields as readonly string[]).includes(name)) errors[name as PostField] = message
    }
  }
  return errors
}
