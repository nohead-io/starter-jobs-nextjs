"use server"

import { ValidationError } from "@nohead/sdk"
import { REFUSAL, verdictOf } from "@/lib/bot-checks"
import { getJob } from "@/lib/content"
import { formKeyClient } from "@/lib/form-key"

/** The fields a visitor fills in. The server action picks these, and nothing else, from the form. */
export type Field = "name" | "email" | "message" | "link"

export interface ApplyState {
  sent: boolean
  /** What was entered, to fill the form in again after an error. */
  values?: Record<Field, string>
  /** A problem per field, in the API's words. */
  errors?: Partial<Record<Field, string>>
  /** A problem with the whole form. */
  error?: string
}

/**
 * Sends an application for the job: creates an unpublished record in the
 * applications collection, which the site's own key can't read. The key that
 * creates it (NOHEAD_FORM_KEY, with only the records:write and assets:write
 * scopes: the form that posts a job uploads logos with it) stays on the server.
 */
export async function apply(slug: string, _previous: ApplyState, form: FormData): Promise<ApplyState> {
  const text = (name: string) => String(form.get(name) ?? "").trim()
  const values = { name: text("name"), email: text("email"), message: text("message"), link: text("link") }

  const verdict = await verdictOf(form)
  if (verdict === "bot") return { sent: true }
  if (verdict === "refused") return { sent: false, values, error: REFUSAL }

  const job = await getJob(slug)
  if (!job) return { sent: false, values, error: "This job has closed." }

  const nohead = formKeyClient()
  if (!nohead) return { sent: false, values, error: "Applications can't be sent at the moment." }

  try {
    await nohead.records.create("applications", {
      data: { job: job.id, ...values, link: values.link || undefined },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      // Each field's first problem, for the fields the visitor fills in.
      const errors = Object.fromEntries(
        Object.entries(error.fieldErrors).filter(([field]) => field in values)
      )
      if (Object.keys(errors).length > 0) return { sent: false, values, errors }
      // A problem with a field the visitor doesn't fill in, such as the job
      // having been deleted since the page was cached.
    }
    console.error(error)
    return { sent: false, values, error: "Your application couldn't be sent. Reload the page and try again." }
  }
  return { sent: true }
}
