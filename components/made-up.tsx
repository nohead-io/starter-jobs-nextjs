import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

const repository = "https://github.com/nohead-io/starter-jobs-nextjs"

/**
 * The band above every page's footer: Elsewhere is invented, it's a Nohead
 * starter, and where to go next. A board of your own has no need for it:
 * delete this file and its place in app/layout.tsx.
 */
export function MadeUp() {
  return (
    <section aria-labelledby="made-up" className="bg-muted/60">
      <div className="mx-auto grid max-w-5xl gap-x-10 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[3fr_2fr_2fr] md:py-16">
        <div>
          <h2 id="made-up" className="text-2xl font-bold tracking-tight text-balance">
            Elsewhere is made up.
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md text-pretty">
            Its companies and jobs are invented, to show what a job board built on Nohead looks like. The
            jobs, the companies and what visitors send live in a Nohead project; Next.js serves the site.
          </p>
          <a href={repository} className={buttonVariants({ size: "lg", className: "mt-6 h-10 px-5" })}>
            Use this starter
            <ChevronRight aria-hidden="true" data-icon="inline-end" />
          </a>
        </div>
        <Card title="Make it yours" href={repository} link="View on GitHub">
          Clone the starter, connect it to your own project, and replace the jobs with yours. Publishing a job
          refreshes the board.
        </Card>
        <Card title="What is Nohead?" href="https://nohead.io" link="Visit nohead.io">
          Design your content model, edit and publish in a shared editor, and read it anywhere through the API
          and SDKs.
        </Card>
      </div>
    </section>
  )
}

function Card({
  title,
  href,
  link,
  children,
}: {
  title: string
  href: string
  link: string
  children: React.ReactNode
}) {
  return (
    <div className="md:border-l md:pl-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">{children}</p>
      <a
        href={href}
        className="hover:text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
      >
        {link}
        <ChevronRight aria-hidden="true" className="size-4" />
      </a>
    </div>
  )
}
