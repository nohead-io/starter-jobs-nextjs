import type { Metadata } from "next"
import Link from "next/link"
import { JobList } from "@/components/job-list"
import { buttonVariants } from "@/components/ui/button"
import { getJobs } from "@/lib/content"

export const metadata: Metadata = { title: "Page not found" }

/**
 * Every missing page: an address that never existed, and, most often, a job
 * that has closed since someone shared its link. So it points on to the jobs
 * still open, three of them right here.
 */
export default async function NotFound() {
  const latest = (await getJobs()).slice(0, 3)
  return (
    <>
      <section className="max-w-2xl">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="mt-2 text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
          Lost in the post
        </h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          There&apos;s nothing at this address. If it was a job, it may have closed: the ones still open are a
          click away.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({ size: "lg", className: "h-10 px-5" })}>
            See the open jobs
          </Link>
          <Link
            href="/companies"
            className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-5" })}
          >
            Browse companies
          </Link>
        </div>
      </section>

      {latest.length > 0 && (
        <section aria-labelledby="latest" className="mt-16 max-w-3xl">
          <h2 id="latest" className="mb-3 text-sm font-semibold">
            Latest jobs
          </h2>
          <JobList jobs={latest} />
        </section>
      )}
    </>
  )
}
