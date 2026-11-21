import type { Metadata } from "next"
import { Globe } from "lucide-react"
import { notFound } from "next/navigation"
import { CompanyLogo } from "@/components/company-logo"
import { JobList } from "@/components/job-list"
import { getCompanies, getCompany, getJobs } from "@/lib/content"
import { paramsOf } from "@/lib/static-params"
import { countOf } from "@/lib/format"

export async function generateStaticParams() {
  return paramsOf(await getCompanies())
}

export async function generateMetadata({ params }: PageProps<"/companies/[slug]">): Promise<Metadata> {
  const company = await getCompany((await params).slug)
  return company ? { title: `Jobs at ${company.name}`, description: company.about } : notFound()
}

export default async function CompanyPage({ params }: PageProps<"/companies/[slug]">) {
  const { slug } = await params
  const company = await getCompany(slug)
  if (!company) notFound()
  const jobs = (await getJobs()).filter((job) => job.company.slug === slug)
  return (
    <>
      <header className="max-w-2xl">
        <CompanyLogo company={company} size={72} />
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">{company.name}</h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">{company.about}</p>
        <a href={company.website} className="group text-primary mt-3 inline-flex items-center gap-1.5">
          <Globe aria-hidden="true" className="size-4 shrink-0" />
          <span className="underline-offset-4 group-hover:underline">{new URL(company.website).host}</span>
        </a>
      </header>
      <section aria-labelledby="open-jobs" className="mt-14">
        <h2 id="open-jobs" className="mb-3 text-sm font-semibold">
          {countOf(jobs.length, "open job", "open jobs")}
        </h2>
        <JobList jobs={jobs} showCompany={false} />
      </section>
    </>
  )
}
