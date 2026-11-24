import type { Metadata } from "next"
import { Rss } from "lucide-react"
import { Schibsted_Grotesk } from "next/font/google"
import { MadeUp } from "@/components/made-up"
import { SiteHeader } from "@/components/site-header"
import { siteUrl } from "@/lib/site"
import "./globals.css"

const sans = Schibsted_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Elsewhere: remote jobs at small software companies", template: "%s · Elsewhere" },
  description:
    "Remote and hybrid jobs at small software companies: engineering, design, product, data and more.",
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: "Elsewhere" }] } },
  // Shared links show the page's image large (app/opengraph-image.tsx, and each job's own).
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="airmail h-1.5" aria-hidden="true" />
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pt-12">{children}</main>
        <MadeUp />
        <footer className="border-t">
          <div className="text-muted-foreground mx-auto flex max-w-5xl flex-wrap justify-between gap-x-6 gap-y-2 px-4 py-8 text-sm sm:px-6">
            <p>Elsewhere, a Nohead job board starter.</p>
            <a href="/feed.xml" className="hover:text-foreground inline-flex items-center gap-1.5">
              <Rss aria-hidden="true" className="size-4 shrink-0" />
              RSS feed
            </a>
          </div>
        </footer>
      </body>
    </html>
  )
}
