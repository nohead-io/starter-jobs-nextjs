import type { Metadata } from "next"
import { BriefcaseBusiness, Globe } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ApplyForm } from "@/components/apply-form"
import { CompanyLogo } from "@/components/company-logo"
import { JobTabs } from "@/components/job-tabs"
import { buttonVariants } from "@/components/ui/button"
import { getJob, getJobs } from "@/lib/content"
import { paramsOf } from "@/lib/static-params"
import { dateOf, placeOf, salaryOf } from "@/lib/format"
import { jobPostingOf } from "@/lib/job-posting"
import { apply } from "./actions"

export async function generateStaticParams() {
  return paramsOf(await getJobs())
}

export async function generateMetadata({ params }: PageProps<"/jobs/[slug]">): Promise<Metadata> {
  const job = await getJob((await params).slug)
  return job ? { title: `${job.title} at ${job.company.name}`, description: job.summary } : notFound()
}

export default async function JobPage({ params }: PageProps<"/jobs/[slug]">) {
  const job = await getJob((await params).slug)
  if (!job) notFound()
  const { company } = job
  // Figures set in tabular numbers; words not, which would space out their commas.
  const facts: [string, string, boolean][] = [
    ["Salary", `${salaryOf(job.salary)} a year`, true],
    ["Type", job.type, false],
    ["Where", placeOf(job), false],
    ["Posted", dateOf(job.postedOn), true],
    ["Apply by", dateOf(job.closesOn), true],
  ]
  return (
    <div className="grid gap-x-10 gap-y-8 md:grid-cols-[1fr_15rem] lg:grid-cols-[1fr_17rem] lg:gap-x-16">
      <script
        type="application/ld+json"
        // Escaped, so no text in the job can close the script.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingOf(job)).replace(/</g, "\\u003c") }}
      />
      <header className="md:col-span-2">
        <Link href={`/companies/${company.slug}`} className="group inline-flex items-center gap-3">
          <CompanyLogo company={company} size={40} />
          <span className="group-hover:text-primary font-semibold">{company.name}</span>
        </Link>
        <h1 className="mt-5 max-w-3xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
          {job.title}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-lg text-pretty">{job.summary}</p>
      </header>

      <aside className="order-last md:order-none md:col-start-2 md:row-span-2 md:row-start-2 md:-mt-8">
        {/* Stays in view as the description scrolls, in windows tall enough for all of it. */}
        <div className="md:top-8 md:[@media(min-height:36rem)]:sticky">
          {/* On phones the tabs, the form's among them, come just before the sidebar. */}
          <div className="hidden md:block">
            <a href="#apply" className={buttonVariants({ size: "lg", className: "mb-6 h-10 w-full" })}>
              Apply for this job
            </a>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t pt-5 text-sm">
            {facts.map(([term, value, figures]) => (
              <div key={term} className="contents">
                <dt className="text-muted-foreground">{term}</dt>
                <dd className={figures ? "font-medium tabular-nums" : "font-medium"}>{value}</dd>
              </div>
            ))}
            <div className="contents">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">
                <Link
                  href={`/categories/${job.category.slug}`}
                  className="hover:text-primary underline-offset-4 hover:underline"
                >
                  {job.category.name}
                </Link>
              </dd>
            </div>
          </dl>

          <div className="mt-8 border-t pt-5">
            <h2 className="font-semibold">About {company.name}</h2>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">{company.about}</p>
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              <li>
                <Link
                  href={`/companies/${company.slug}`}
                  className="group text-primary inline-flex items-center gap-1.5"
                >
                  <BriefcaseBusiness aria-hidden="true" className="size-4 shrink-0" />
                  <span className="underline-offset-4 group-hover:underline">Jobs at {company.name}</span>
                </Link>
              </li>
              <li>
                <a href={company.website} className="group text-primary inline-flex items-center gap-1.5">
                  <Globe aria-hidden="true" className="size-4 shrink-0" />
                  <span className="underline-offset-4 group-hover:underline">
                    {new URL(company.website).host}
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <JobTabs
        className="min-w-0 md:col-start-1 lg:max-w-2xl"
        description={
          <div
            className="prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-h2:text-xl max-w-none"
            dangerouslySetInnerHTML={{ __html: job.description }}
          />
        }
        apply={<ApplyForm action={apply.bind(null, job.slug)} company={company.name} />}
      />
    </div>
  )
}
