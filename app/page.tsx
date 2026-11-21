import { JobSearch } from "@/components/job-search"
import { boardJobOf, getCompanies, getJobs } from "@/lib/content"
import { countOf } from "@/lib/format"

export default async function Home() {
  const [jobs, companies] = await Promise.all([getJobs(), getCompanies()])
  const hiring = companies.filter((company) => jobs.some((job) => job.company.slug === company.slug))
  return (
    <>
      <section className="max-w-3xl">
        <h1 className="max-w-xl text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
          Remote jobs at small software companies
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg text-pretty">
          {jobs.length === 0
            ? "No open jobs right now."
            : `${countOf(jobs.length, "open job", "open jobs")} at ${countOf(hiring.length, "company", "companies")}, in engineering, design, product and more. Work from home, or from wherever home is this month.`}
        </p>
      </section>

      <div className="mt-7">
        {/* Every open job, searched and filtered in the browser. */}
        <JobSearch jobs={jobs.map(boardJobOf)} />
      </div>
    </>
  )
}
