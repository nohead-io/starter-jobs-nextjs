"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * The site's tabs, shared by a job's page and the form that posts a job: a
 * row of tabs on a line with an underline, or a row of pills in a track,
 * either way with a marker that slides to the open tab, and panels that
 * slide in from the side their tab is on.
 */

/** For the tabs' root: clipped sideways, so content sliding in doesn't scroll the page; a little room on each side keeps focus rings whole. */
export const tabsRoot = "-mx-1 gap-0 overflow-x-clip px-1"

/**
 * For each panel: when a tab opens, its content fades in and slides sideways
 * from the side the tab is on. Base UI sets the panel's
 * data-activation-direction ("none" on the page's first load, which doesn't
 * animate). The panel closing doesn't animate (data-ending-style): Base UI
 * keeps a panel shown until its animation ends.
 */
export const tabPanel = [
  "text-base duration-300 motion-reduce:animate-none data-ending-style:animate-none!",
  // A panel takes focus (from the keyboard, or from code moving it there): a
  // solid outline shows where, inside the room the tabs' root leaves around it.
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring",
  "data-[activation-direction=left]:animate-in data-[activation-direction=left]:fade-in-0 data-[activation-direction=left]:slide-in-from-left-6",
  "data-[activation-direction=right]:animate-in data-[activation-direction=right]:fade-in-0 data-[activation-direction=right]:slide-in-from-right-6",
].join(" ")

// The tabs not open are in the muted text colour, not shadcn's 60% of the
// text colour, which falls short of 4.5:1 on white and on the pills' track.

/** The row of tabs, as [value, label]. The list is as tall as its tabs, its border the line the underline slides along. */
export function LineTabsList({ tabs }: { tabs: [string, React.ReactNode][] }) {
  return (
    <TabsList
      variant="line"
      className="relative w-full justify-start gap-6 border-b p-0 group-data-horizontal/tabs:h-auto"
    >
      {tabs.map(([value, label]) => (
        <TabsTrigger
          key={value}
          value={value}
          className="text-muted-foreground h-auto flex-none px-0 pb-[7px] text-sm after:hidden"
        >
          {label}
        </TabsTrigger>
      ))}
      <TabsPrimitive.Indicator
        renderBeforeHydration
        className="bg-foreground absolute -bottom-px left-(--active-tab-left) h-0.5 w-(--active-tab-width) transition-[left,width] duration-300 ease-out motion-reduce:transition-none"
      />
    </TabsList>
  )
}

/** The row of tabs as pills in a track, as [value, label]: a pill slides to the open one. */
export function PillTabsList({ tabs, label }: { tabs: [string, React.ReactNode][]; label: string }) {
  return (
    <TabsList
      aria-label={label}
      // Full width on phones, the tabs sharing it; as wide as they need from tablets up.
      className="relative h-auto w-full p-1 group-data-horizontal/tabs:h-auto sm:w-fit"
    >
      {/*
        The pill comes before the tabs, so the tabs paint over it in their
        order, with no z-index: one would also lift them over the pane
        sliding in below, and Safari would move them onto a layer of their
        own for the slide, where their text drops a pixel until it ends.
      */}
      <TabsPrimitive.Indicator
        renderBeforeHydration
        className="bg-background dark:bg-input/30 dark:border-input absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-md shadow-sm transition-[left,width] duration-300 ease-out motion-reduce:transition-none dark:border"
      />
      {tabs.map(([value, label]) => (
        <TabsTrigger
          key={value}
          value={value}
          // The open tab is drawn by the pill alone: without its own background and shadow (shadcn's, set for the default variant), which would fade in place while the pill slides.
          className="text-muted-foreground h-auto flex-1 px-4 py-1.5 data-active:bg-transparent group-data-[variant=default]/tabs-list:data-active:shadow-none sm:flex-none dark:data-active:border-transparent dark:data-active:bg-transparent"
        >
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
