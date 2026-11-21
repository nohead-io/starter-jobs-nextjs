import type { Metadata } from "next"
import Link from "next/link"
import { CompanyLogo } from "@/components/company-logo"
import { getCompanies, getJobs } from "@/lib/content"
import { countOf } from "@/lib/format"

export const metadata: Metadata = { title: "Companies" }

export default async function CompaniesPage() {
  const [companies, jobs] = await Promise.all([getCompanies(), getJobs()])
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Companies</h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg text-pretty">
        The companies hiring on Elsewhere. Each is small enough that your work shows.
      </p>
      <ul className="mt-8 grid gap-x-10 border-t sm:grid-cols-2">
        {companies.map((company) => {
          const count = jobs.filter((job) => job.company.slug === company.slug).length
          return (
            <li key={company.slug} className="border-b">
              <Link
                href={`/companies/${company.slug}`}
                className="group hover:bg-muted/60 focus-visible:ring-ring -mx-3 flex items-start gap-4 rounded-lg px-3 py-5 outline-none focus-visible:ring-2"
              >
                <CompanyLogo company={company} size={48} />
                <div className="min-w-0">
                  <h2 className="group-hover:text-primary font-semibold">{company.name}</h2>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm text-pretty">
                    {company.about}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {count === 0 ? "No open jobs" : countOf(count, "open job", "open jobs")}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
