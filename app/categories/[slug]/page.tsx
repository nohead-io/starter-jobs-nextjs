import type { Metadata } from "next"
import { Rss } from "lucide-react"
import { notFound } from "next/navigation"
import { JobList } from "@/components/job-list"
import { getCategories, getCategory, getJobs } from "@/lib/content"
import { paramsOf } from "@/lib/static-params"
import { countOf } from "@/lib/format"

export async function generateStaticParams() {
  return paramsOf(await getCategories())
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug)
  if (!category) notFound()
  return {
    title: `${category.name} jobs`,
    description: category.description,
    alternates: {
      types: {
        "application/rss+xml": [
          { url: `/categories/${category.slug}/feed.xml`, title: `${category.name} jobs · Elsewhere` },
          { url: "/feed.xml", title: "Elsewhere" },
        ],
      },
    },
  }
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) notFound()
  const jobs = (await getJobs()).filter((job) => job.category.slug === slug)
  return (
    <>
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{category.name} jobs</h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">{category.description}</p>
      </header>
      <section aria-labelledby="open-jobs" className="mt-14">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="open-jobs" className="text-sm font-semibold">
            {countOf(jobs.length, "open job", "open jobs")}
          </h2>
          <a
            href={`/categories/${slug}/feed.xml`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <Rss aria-hidden="true" className="size-4 shrink-0" />
            RSS feed
          </a>
        </div>
        <JobList jobs={jobs} />
      </section>
    </>
  )
}
