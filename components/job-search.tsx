"use client"

import { Search as SearchIcon, SlidersHorizontal } from "lucide-react"
import {
  addTransitionType,
  startTransition,
  Suspense,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react"
import { useSearchParams } from "next/navigation"
import { JobList } from "@/components/job-list"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BoardJob, JobRow } from "@/lib/content"
import { countOf } from "@/lib/format"

/** The facets the jobs can be narrowed by: each one's name in the page's address, and its value on a job. */
const facets = [
  { name: "Category", param: "category", valueOf: (job: BoardJob) => job.category.name },
  { name: "Type", param: "type", valueOf: (job: BoardJob) => job.type },
  { name: "Workplace", param: "workplace", valueOf: (job: BoardJob) => job.workplace },
  { name: "Location", param: "location", valueOf: (job: BoardJob) => job.location },
  { name: "Company", param: "company", valueOf: (job: BoardJob) => job.company.name },
]

/** What's searched for and chosen, as in the page's address: ?q=words&type=Full-time&type=Contract. */
type Chosen = { query: string; filters: Record<string, string[]> }

const nothing: Chosen = { query: "", filters: {} }

function chosenOf(search: string): Chosen {
  const params = new URLSearchParams(search)
  return {
    query: params.get("q") ?? "",
    filters: Object.fromEntries(facets.map(({ param }) => [param, params.getAll(param)])),
  }
}

function searchOf({ query, filters }: Chosen) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  for (const { param } of facets) for (const value of filters[param] ?? []) params.append(param, value)
  const search = params.toString()
  return search ? `?${search}` : ""
}

/** Whether a job has every word searched for, and one of the values chosen in each facet but `except`. */
function matches(job: BoardJob, words: string[], filters: Chosen["filters"], except?: string) {
  const text =
    `${job.title} ${job.company.name} ${job.category.name} ${job.type} ${job.workplace} ${job.location} ${job.summary}`.toLowerCase()
  if (!words.every((word) => text.includes(word))) return false
  return facets.every(
    ({ param, valueOf }) =>
      param === except || !filters[param]?.length || filters[param].includes(valueOf(job))
  )
}

/** What the list and the filters show: the jobs, how many there are, and each facet's values with their counts. */
interface View {
  /** Whether these are search results (words or filters), or the latest jobs. */
  searched: boolean
  rows: JobRow[]
  total: number
  facets: { name: string; param: string; values: [string, number][] }[]
}

/** The view of every job: all of them, newest first, as the page was rendered. */
function viewOfJobs(jobs: BoardJob[]): View {
  return {
    searched: false,
    rows: jobs,
    total: jobs.length,
    facets: facets.map(({ name, param, valueOf }) => {
      const counts = new Map<string, number>()
      for (const job of jobs) counts.set(valueOf(job), (counts.get(valueOf(job)) ?? 0) + 1)
      return { name, param, values: [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)) }
    }),
  }
}

/**
 * The view of the jobs that match what's searched for and chosen. Every value
 * stays in its place, each counting the jobs it would show given the other
 * facets' choices, 0 for none: the filters keep their places as they narrow.
 */
function viewOf(jobs: BoardJob[], all: View, { query, filters }: Chosen): View {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0 && Object.values(filters).flat().length === 0) return all
  const rows = jobs.filter((job) => matches(job, words, filters))
  return {
    searched: true,
    rows,
    total: rows.length,
    facets: facets.map(({ name, param, valueOf }, index) => {
      const counts = new Map<string, number>()
      for (const job of jobs)
        if (matches(job, words, filters, param)) counts.set(valueOf(job), (counts.get(valueOf(job)) ?? 0) + 1)
      return {
        name,
        param,
        values: all.facets[index]!.values.map(
          ([value]) => [value, counts.get(value) ?? 0] as [string, number]
        ),
      }
    }),
  }
}

/**
 * The jobs, newest first, with a search box and filters that narrow them
 * down, all in the browser.
 */
export function JobSearch({ jobs }: { jobs: BoardJob[] }) {
  // What's in the search box, at once; the list follows it in a "filter" transition.
  const [text, setText] = useState("")
  const [chosen, setChosen] = useState(nothing)
  // On small screens the filters fold away behind a button.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersId = useId()

  // A new choice animates the list and the filters: a "filter" transition,
  // with React's <ViewTransition>. It can drop a keystroke while the list
  // animates (react/react#37997), a cost taken for the animation.
  const choose = (next: Chosen) =>
    startTransition(() => {
      addTransitionType("filter")
      setChosen(next)
    })

  // The search and the filters are kept in the page's address, so Back from a
  // job returns to them and a filtered list can be shared. The board replaces
  // the address as the visitor searches and filters (without a history entry
  // for each keystroke or click), and follows it when it changes some other
  // way (<Address>, below): on arriving, on Back, or by a link, such as the
  // site's name to the bare page.
  // The address the board wrote last, so its own changes aren't applied again.
  const written = useRef("")
  const remember = (next: Chosen) => {
    written.current = searchOf(next)
    history.replaceState(null, "", `${location.pathname}${written.current}`)
  }
  // Words are written once typing pauses, or as the box loses focus (to a
  // click on a job, say): Safari stops a page that changes its address more
  // than 100 times in 10 seconds.
  const typed = useRef<{ chosen: Chosen; timer: ReturnType<typeof setTimeout> }>(undefined)
  const writeTyped = () => {
    if (!typed.current) return
    clearTimeout(typed.current.timer)
    remember(typed.current.chosen)
    typed.current = undefined
  }
  useEffect(() => () => clearTimeout(typed.current?.timer), [])
  const apply = (search: string) => {
    written.current = search
    const next = chosenOf(search)
    setText(next.query)
    choose(next)
  }
  const follow = (search: string) => {
    if (search !== written.current) apply(search)
  }

  // Every job as a view: the list before any search, and each facet's values in the board's order.
  const all = useMemo(() => viewOfJobs(jobs), [jobs])
  const shown = useMemo(() => viewOf(jobs, all, chosen), [jobs, all, chosen])

  const count = Object.values(chosen.filters).flat().length
  const filtered = text.trim() !== "" || count > 0

  const toggle = (param: string, value: string, on: boolean) => {
    const values = (chosen.filters[param] ?? []).filter((v) => v !== value)
    // With the words in the box, which the list may not show yet.
    const next = { query: text, filters: { ...chosen.filters, [param]: on ? [...values, value] : values } }
    choose(next)
    remember(next)
  }

  const type = (query: string) => {
    setText(query)
    const next = { ...chosen, query }
    choose(next)
    clearTimeout(typed.current?.timer)
    typed.current = { chosen: next, timer: setTimeout(writeTyped, 300) }
  }

  const clear = () => {
    setText("")
    choose(nothing)
    remember(nothing)
  }

  return (
    <>
      {/* Read in the browser only: the page around it is prerendered without an address. */}
      <Suspense fallback={null}>
        <Address onArrive={apply} onChange={follow} />
      </Suspense>
      <div className="flex gap-3 sm:max-w-sm">
        <div role="search" className="relative min-w-0 flex-1">
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            value={text}
            onChange={(event) => type(event.target.value)}
            onBlur={writeTyped}
            placeholder="Search jobs"
            aria-label="Search jobs"
            className="h-10 pl-9 text-base"
          />
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-10 md:hidden"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal aria-hidden="true" />
          {count ? `Filters (${count})` : "Filters"}
        </Button>
      </div>
      <div className="mt-6 grid gap-x-10 md:mt-8 md:grid-cols-[11rem_1fr]">
        {/*
          On small screens the filters fold open and shut: their row grows from
          nothing (0fr) to its height as they fade in. Folded, they're hidden
          from keyboards and screen readers too. Wide screens always show them.
        */}
        <div
          id={filtersId}
          className={`grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none md:visible md:grid-rows-[1fr] md:opacity-100 ${filtersOpen ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}
        >
          {/* A little room on every side keeps the checkboxes' focus rings from being cut off. */}
          <div className="-m-1 min-h-0 overflow-hidden p-1 md:overflow-visible">
            <div className="grid grid-cols-2 gap-6 pb-8 sm:grid-cols-3 md:flex md:flex-col md:pb-0">
              {shown.facets.map(({ name, param, values }) => (
                <FacetValues
                  key={param}
                  name={name}
                  values={values}
                  selected={chosen.filters[param] ?? []}
                  onToggle={(value, on) => toggle(param, value, on)}
                />
              ))}
            </div>
          </div>
        </div>
        <section aria-labelledby={`${filtersId}-results`} className="md:col-start-2">
          {/* One fixed height, with or without the button, so the list never moves. */}
          <div className="mb-3 flex h-5 items-center justify-between gap-4">
            <h2 id={`${filtersId}-results`} className="text-sm font-semibold" aria-live="polite">
              {/* Always a count, every job's before a search: a search then changes only the number. */}
              {countOf(shown.total, "job", "jobs")}
            </h2>
            {filtered && (
              <Button variant="link" size="sm" className="h-5 p-0" onClick={clear}>
                Clear search
              </Button>
            )}
          </div>
          {shown.rows.length > 0 || !shown.searched ? (
            <JobList jobs={shown.rows} />
          ) : (
            // On the list's own line; "Clear search" is above it.
            <Empty className="rounded-none border-t border-solid">
              <EmptyHeader>
                <EmptyTitle>No open jobs match</EmptyTitle>
                <EmptyDescription>Try fewer words or filters.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </>
  )
}

/** Tells the board its page's address, ?q=…&type=…, on arriving and when it changes. */
function Address({
  onArrive,
  onChange,
}: {
  onArrive: (search: string) => void
  onChange: (search: string) => void
}) {
  const params = useSearchParams().toString()
  // The board's handlers as they are now, without the effects running again when they change.
  const arrive = useEffectEvent(onArrive)
  const change = useEffectEvent(onChange)
  // Also when the page is shown again by Back.
  useEffect(() => arrive(location.search), [])
  const seen = useRef(params)
  useEffect(() => {
    if (params === seen.current) return
    seen.current = params
    // The address as it is now: while the visitor types, the parameters can trail the board's latest change.
    change(location.search)
  }, [params])
  return null
}

function FacetValues({
  name,
  values,
  selected,
  onToggle,
}: {
  name: string
  values: [string, number][]
  selected: string[]
  onToggle: (value: string, on: boolean) => void
}) {
  const id = useId()
  if (values.length === 0) return null
  return (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold">{name}</legend>
      <ul className="flex flex-col gap-2">
        {values.map(([value, count], index) => {
          // None among the results: it stays in its place, faded as shadcn fades a disabled field, but can't be chosen.
          // One already chosen can always be unchosen.
          const off = count === 0 && !selected.includes(value)
          return (
            <ViewTransition key={value} default={{ filter: "list-item", default: "none" }}>
              <li className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-${index}`}
                  checked={selected.includes(value)}
                  disabled={off}
                  onCheckedChange={(checked) => onToggle(value, checked)}
                />
                <Label htmlFor={`${id}-${index}`} className={off ? "font-normal opacity-50" : "font-normal"}>
                  {value} <span className="text-muted-foreground tabular-nums">{count}</span>
                </Label>
              </li>
            </ViewTransition>
          )
        })}
      </ul>
    </fieldset>
  )
}
