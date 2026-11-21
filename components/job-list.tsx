import Link from "next/link"
import { ViewTransition } from "react"
import { CompanyLogo } from "@/components/company-logo"
import type { JobRow as Job } from "@/lib/content"
import { placeOf, salaryOf, shortDateOf } from "@/lib/format"

/**
 * Jobs as a list of rows, each linking to the job's page. When filters change
 * the list (a "filter" transition), rows that stay move to their new place and
 * the others fade.
 */
export function JobList({ jobs, showCompany = true }: { jobs: Job[]; showCompany?: boolean }) {
  if (jobs.length === 0)
    return <p className="text-muted-foreground border-t py-8">No open jobs here right now.</p>
  return (
    <ul className="border-t">
      {jobs.map((job) => (
        <ViewTransition key={job.slug} default={{ filter: "list-item", default: "none" }}>
          <li className="border-b">
            <JobRow job={job} showCompany={showCompany} />
          </li>
        </ViewTransition>
      ))}
    </ul>
  )
}

function JobRow({ job, showCompany }: { job: Job; showCompany: boolean }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group hover:bg-muted/60 focus-visible:ring-ring -mx-3 flex items-start gap-4 rounded-lg px-3 py-4 outline-none focus-visible:ring-2 sm:items-center"
    >
      {showCompany && <CompanyLogo company={job.company} size={48} />}
      <div className="min-w-0 flex-1">
        <h3 className="group-hover:text-primary leading-snug font-semibold">{job.title}</h3>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {showCompany && <span className="text-foreground font-medium">{job.company.name}</span>}
          {showCompany && <span aria-hidden="true">, </span>}
          {placeOf(job)}
        </p>
        <p className="text-muted-foreground mt-1.5 text-sm sm:hidden">
          <span className="tabular-nums">{salaryOf(job.salary)}</span>
          {job.type !== "Full-time" && `, ${job.type.toLowerCase()}`}
        </p>
      </div>
      <div className="hidden shrink-0 text-right text-sm sm:block">
        <p className="font-medium tabular-nums">{salaryOf(job.salary)}</p>
        <p className="text-muted-foreground mt-0.5">{job.type}</p>
      </div>
      <p className="text-muted-foreground hidden w-16 shrink-0 text-right text-sm tabular-nums md:block">
        <time dateTime={job.postedOn}>{shortDateOf(job.postedOn)}</time>
      </p>
    </Link>
  )
}
