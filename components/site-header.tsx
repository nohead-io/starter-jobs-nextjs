"use client"

import { Collapsible } from "@base-ui/react/collapsible"
import { Menu, X } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"

const links: { href: Route; label: string }[] = [
  { href: "/about", label: "About" },
  { href: "/companies", label: "Companies" },
]

/**
 * The site's name and its links: in a row from tablets up, and on phones
 * behind a menu button, opening below the bar. The page the visitor is on
 * is marked, for screen readers too (aria-current).
 *
 * The page's path is read inside <Suspense>: Next.js prerenders each route
 * with a param it doesn't know yet (a job published since the build, say) as
 * a shell without its address, and rebuilds that shell when the content
 * changes. There the header shows with no link marked, until the browser has
 * the path.
 */
export function SiteHeader() {
  return (
    <Suspense fallback={<Header pathname="" />}>
      <HeaderOnPage />
    </Suspense>
  )
}

function HeaderOnPage() {
  return <Header pathname={usePathname()} />
}

function Header({ pathname }: { pathname: string }) {
  // The page the menu was opened on: it's closed on any other, so it closes
  // once a link in it has taken the visitor to another page.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (opening: boolean) => setOpenOn(opening ? pathname : null)
  const button = useRef<HTMLButtonElement>(null)

  // Escape closes it too, and puts focus back on the button.
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpenOn(null)
      button.current?.focus()
    }
    document.addEventListener("keydown", close)
    return () => document.removeEventListener("keydown", close)
  }, [open])

  const current = (href: string) => (pathname.startsWith(href) ? "page" : undefined)

  return (
    <header>
      <nav aria-label="Site">
        {/* On phones the links are a Base UI Collapsible: its button says whether it's open, and the panel slides open. */}
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-4 sm:px-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Elsewhere
            </Link>
            <ul className="ml-auto hidden items-center gap-8 sm:flex">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current(href)}
                    className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground text-sm font-medium"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <Collapsible.Trigger
              ref={button}
              // A border that turns the ring colour on focus, as shadcn's buttons have: the faint halo alone is hard to see.
              className="hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 -mr-2 ml-auto grid size-10 place-items-center rounded-lg border border-transparent outline-none focus-visible:ring-3 sm:hidden"
            >
              {open ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
              <span className="sr-only">Menu</span>
            </Collapsible.Trigger>
          </div>
          {/* It grows from no height to its own (Base UI's --collapsible-panel-height), its links fading in. */}
          <Collapsible.Panel className="h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-200 ease-out data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0 motion-reduce:transition-none sm:hidden">
            <ul className="mx-auto max-w-5xl border-b px-4 pb-3">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current(href)}
                    // A link to the page already open closes the menu as well.
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground block py-3 text-base font-medium"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </Collapsible.Panel>
        </Collapsible.Root>
      </nav>
    </header>
  )
}
