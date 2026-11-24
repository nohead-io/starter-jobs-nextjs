import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About",
  description:
    "Elsewhere is a demo job board, built with Next.js on Nohead to show a real site's content kept in a CMS.",
}

/** The address of this site's code, for the links below. */
const repository = "https://github.com/nohead-io/starter-jobs-nextjs"

/**
 * What the board is, who it's for and how it's made. The page is written in
 * code, like any other: a board of your own tells its own story here.
 */
export default function AboutPage() {
  return (
    <article className="max-w-2xl">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About Elsewhere</h1>
      <p className="text-muted-foreground mt-4 text-lg text-pretty">
        Elsewhere is a job board for remote and hybrid work at small software companies. It&apos;s also a
        demo: its companies and jobs are invented, and it&apos;s here to show how a site like it is made.
      </p>

      <div className="prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-h2:text-xl prose-a:text-primary prose-a:underline-offset-4 mt-10 max-w-none">
        <h2>A board that isn&apos;t real</h2>
        <p>
          Every company on Elsewhere, its logo and its jobs were written for this demo. None of them is
          hiring. Everything works as it would on a real board, though: you can search and filter the jobs,
          follow new jobs by <a href="/feed.xml">RSS</a>, apply to a job and{" "}
          <Link href="/post">post one</Link>. What you send is kept as it would be, unpublished, and deleted
          regularly; nobody reads it, and nothing you post goes live.
        </p>

        <h2>Why it&apos;s here</h2>
        <p>
          Elsewhere is a starter for <a href="https://nohead.io">Nohead</a>, an API-first headless CMS: its
          content is modelled once, edited in Nohead&apos;s editor and served through an API. It shows what a
          site built on Nohead looks like when it has to do more than show pages: content edited in Nohead and
          read by the site, search, images, forms that write back, and a site that refreshes when something is
          published.
        </p>

        <h2>How it&apos;s made</h2>
        <ul>
          <li>
            <strong>Content</strong> lives in a Nohead project: jobs, the companies hiring and the categories
            they&apos;re in, defined as code in the repository and{" "}
            <a href="https://docs.nohead.io/guides/reading-content">read with the Nohead SDK</a>.
          </li>
          <li>
            <strong>Search and filters</strong> run in the browser, against Nohead&apos;s{" "}
            <a href="https://docs.nohead.io/guides/public-search">public search</a>.
          </li>
          <li>
            <strong>Logos</strong> are resized and converted by Nohead&apos;s{" "}
            <a href="https://docs.nohead.io/guides/images">image URLs</a>.
          </li>
          <li>
            <strong>Applications and posted jobs</strong> are{" "}
            <a href="https://docs.nohead.io/guides/writing-content">written to Nohead</a> by the site&apos;s
            server, unpublished, for someone to review.
          </li>
          <li>
            <strong>Pages</strong> are built ahead of time and{" "}
            <a href="https://docs.nohead.io/guides/webhooks">refreshed by a webhook</a> when content is
            published.
          </li>
          <li>
            <strong>The site</strong> is <a href="https://nextjs.org">Next.js</a>, with{" "}
            <a href="https://ui.shadcn.com">shadcn/ui</a> for its interface,{" "}
            <a href="https://lucide.dev">Lucide</a> for icons and{" "}
            <a href="https://fonts.google.com/specimen/Schibsted+Grotesk">Schibsted Grotesk</a> for its type.
          </li>
        </ul>

        <h2>Make one of your own</h2>
        <p>
          The code is <a href={repository}>on GitHub</a>, under the MIT licence. Its README says how to
          connect a copy to your own Nohead project, fill it with your own jobs and deploy it.
        </p>
      </div>
    </article>
  )
}
