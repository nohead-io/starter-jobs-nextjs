import { Info } from "lucide-react"
import type { Metadata } from "next"
import { PostJobForm } from "@/components/post-job-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getCategories, getCompanies, getJobChoices } from "@/lib/content"
import { post } from "./actions"

export const metadata: Metadata = {
  title: "Post a job",
  description: "Post a remote job at a small software company. Every job is reviewed before it goes live.",
}

export default async function PostPage() {
  const [companies, categories, choices] = await Promise.all([
    getCompanies(),
    getCategories(),
    getJobChoices(),
  ])
  return (
    <div className="max-w-2xl">
      <header>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Post a job</h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          Every job is reviewed before it shows on the board. Choose your company if it&apos;s here already,
          or add it with the job.
        </p>
      </header>
      <Alert className="mt-10">
        <Info aria-hidden="true" />
        <AlertTitle>This is a demo</AlertTitle>
        <AlertDescription>
          Jobs posted here go to its Nohead project and are deleted regularly; none goes live.
        </AlertDescription>
      </Alert>
      <div className="mt-10">
        <PostJobForm
          action={post}
          companies={companies.map(({ slug, name, logo }) => ({ slug, name, logo }))}
          categories={categories.map(({ slug, name }) => ({ slug, name }))}
          choices={choices}
        />
      </div>
    </div>
  )
}
