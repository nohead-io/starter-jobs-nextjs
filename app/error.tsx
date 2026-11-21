"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * Any page that fails to render, most often because its content couldn't be
 * read just then: it says so, and offers to try again. The header and footer
 * stay, so the rest of the board is a click away.
 */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  // In the server's log, or your error reporting, to see what went wrong.
  useEffect(() => console.error(error), [error])

  return (
    <section className="max-w-2xl">
      <title>Page not loaded · Elsewhere</title>
      <h1 className="text-3xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
        Held up in transit
      </h1>
      <p className="text-muted-foreground mt-4 text-lg text-pretty">
        This page couldn&apos;t be loaded just now. Try again, or come back in a minute.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" className="h-10 px-5" onClick={() => retry()}>
          Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "h-10 px-5" })}>
          See the open jobs
        </Link>
      </div>
    </section>
  )
}
