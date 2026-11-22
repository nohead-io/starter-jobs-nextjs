import type { JobSummary } from "./content"

/** A salary range in short form, such as "€75k–95k", "DKK 850k–1M", or "€75k" for one figure. */
export function salaryOf({ min, max, currency }: JobSummary["salary"]) {
  const format = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  })
  const [low, high] = [format.format(min), format.format(max)]
  // "€75K–€95K" reads better as "€75k–95k".
  const symbol = /^[^\d]*/.exec(high)![0]
  const range = low === high ? low : `${low}–${high.slice(symbol.length)}`
  // Only a K after a figure: a currency code such as DKK keeps its own.
  return range.replace(/(\d)K\b/g, "$1k")
}

/** The order jobs are listed in, for sort(): newest first, and those posted the same day by title. */
export function newestFirst(
  a: Pick<JobSummary, "postedOn" | "title">,
  b: Pick<JobSummary, "postedOn" | "title">
) {
  return b.postedOn.localeCompare(a.postedOn) || a.title.localeCompare(b.title)
}

/** A count and its noun, such as "1 open job" or "12 open jobs". */
export function countOf(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

/** Where the job is done, in words: "Remote in Europe", "Remote, anywhere", "Hybrid in Copenhagen". */
export function placeOf({ workplace, location }: Pick<JobSummary, "workplace" | "location">) {
  if (workplace === "Remote" && location === "Worldwide") return "Remote, anywhere"
  return `${workplace} in ${location}`
}

/** A date such as "12 Nov 2026". */
export function dateOf(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date))
}

/** A date without its year, such as "12 Nov". */
export function shortDateOf(date: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(date)
  )
}
