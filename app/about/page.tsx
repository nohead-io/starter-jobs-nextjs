import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About",
  description:
    "How Elsewhere, a demo job board, is made: Next.js, with its content, search, images and forms on Nohead.",
}

/**
 * What the board is, who it's for and how it's made. The page is written in
 * code, like any other: a board of your own tells its own story here.
 */
export default function AboutPage() {
  return (
    <article className="max-w-2xl">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About Elsewhere</h1>
      <p className="text-muted-foreground mt-4 text-lg text-pretty">
        Elsewhere is a made-up job board for remote jobs at small software companies. The software behind it
        is open source and built on{" "}
        <a href="https://nohead.io" className="text-primary underline underline-offset-4">
          Nohead
        </a>
        , and you can deploy it yourself and make it your own. Nothing you post goes live.
      </p>

      <div className="prose prose-neutral dark:prose-invert prose-headings:tracking-tight prose-h2:text-xl prose-a:text-primary prose-a:underline-offset-4 mt-10 max-w-none">
        <h2>What is Nohead?</h2>
        <p>
          Nohead stores structured content for sites and apps. You describe your content as collections of
          typed fields, your team writes and publishes it in a shared editor, and your code reads and writes
          it through an API, with SDKs for TypeScript, Python and Ruby. Every change to a record is kept in
          its history and can be undone. Search, resized images and webhooks come with it, so a site like this
          one needs no database, search engine or image service of its own. The{" "}
          <a href="https://docs.nohead.io/quickstart">quickstart</a> takes a few minutes.
        </p>

        <h2>How it works</h2>
        <p>Nohead holds all the content behind the job board and handles user submissions.</p>
        <ul>
          <li>
            <strong>The jobs, companies and categories</strong> live in a Nohead project, modelled as code in
            the repository and{" "}
            <a href="https://docs.nohead.io/guides/reading-content">read with the Nohead SDK</a>.
          </li>
          <li>
            <strong>Search and filters</strong> run in the browser, on Nohead&apos;s{" "}
            <a href="https://docs.nohead.io/guides/public-search">public search</a>, with a token that finds
            only published jobs.
          </li>
          <li>
            <strong>Logos</strong> are resized and converted by Nohead&apos;s{" "}
            <a href="https://docs.nohead.io/guides/images">image URLs</a>.
          </li>
          <li>
            <strong>Applications and posted jobs</strong> are{" "}
            <a href="https://docs.nohead.io/guides/writing-content">written to Nohead</a> by the site&apos;s
            server, unpublished, for someone to review. On this demo, nobody publishes them, and they&apos;re
            deleted regularly.
          </li>
          <li>
            <strong>Pages</strong> are built ahead of time, and a{" "}
            <a href="https://docs.nohead.io/guides/webhooks">webhook</a> refreshes them when content is
            published.
          </li>
          <li>
            <strong>The site</strong> is <a href="https://nextjs.org">Next.js</a>, with{" "}
            <a href="https://ui.shadcn.com">shadcn/ui</a> for its interface,{" "}
            <a href="https://lucide.dev">Lucide</a> for icons and{" "}
            <a href="https://fonts.google.com/specimen/Schibsted+Grotesk">Schibsted Grotesk</a> for its type.
            Its paper plane icon is from{" "}
            <a href="https://www.streamlinehq.com/icons">Streamline&apos;s free icons</a>.
          </li>
        </ul>
      </div>
    </article>
  )
}
