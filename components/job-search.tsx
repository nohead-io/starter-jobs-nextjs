"use client"

import { instantMeiliSearch } from "@meilisearch/instant-meilisearch"
import { SEARCH_URL, type ExpandedAsset, type ExpandedRecord, type SearchHit } from "@nohead/sdk/search"
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
import { preconnect } from "react-dom"
import {
  Configure,
  InstantSearch,
  InstantSearchSSRProvider,
  useInfiniteHits,
  useInstantSearch,
  useRefinementList,
  useSearchBox,
} from "react-instantsearch"
import { useSearchParams } from "next/navigation"
import { JobList } from "@/components/job-list"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BoardJob, JobRow, Search } from "@/lib/content"
import { countOf, newestFirst } from "@/lib/format"

/** How many jobs search returns at a time: the first page, then each Show more. */
const HITS_PER_PAGE = 100

/**
 * The facets the jobs can be narrowed by: each one's name in the page's
 * address, its path in a search hit, and its value on the site's own jobs.
 */
const facets = [
  {
    name: "Category",
    param: "category",
    attribute: "expanded.category.data.name",
    valueOf: (job: BoardJob) => job.category.name,
  },
  { name: "Type", param: "type", attribute: "data.type", valueOf: (job: BoardJob) => job.type },
  {
    name: "Workplace",
    param: "workplace",
    attribute: "data.workplace",
    valueOf: (job: BoardJob) => job.workplace,
  },
  {
    name: "Location",
    param: "location",
    attribute: "data.location",
    valueOf: (job: BoardJob) => job.location,
  },
  {
    name: "Company",
    param: "company",
    attribute: "expanded.company.data.name",
    valueOf: (job: BoardJob) => job.company.name,
  },
]

/** What's searched for and chosen, as in the page's address: ?q=words&type=Full-time&type=Contract. */
type Chosen = { query: string; refinementList: Record<string, string[]> }

function chosenOf(search: string): Chosen {
  const params = new URLSearchParams(search)
  return {
    query: params.get("q") ?? "",
    refinementList: Object.fromEntries(
      facets.map(({ param, attribute }) => [attribute, params.getAll(param)])
    ),
  }
}

function searchOf({ query, refinementList }: Partial<Chosen>) {
  const params = new URLSearchParams()
  if (query?.trim()) params.set("q", query.trim())
  for (const { param, attribute } of facets)
    for (const value of refinementList?.[attribute] ?? []) params.append(param, value)
  const search = params.toString()
  return search ? `?${search}` : ""
}

/** A job as public search returns it: what its row shows, with the company's name and logo from the hit itself. */
type JobHit = SearchHit<
  {
    slug: string
    title: string
    type: string
    workplace: string
    location: string
    salary_min: number
    salary_max: number
    salary_currency: string
    posted_on: number // Unix seconds, as search has dates
  },
  { company: ExpandedRecord<{ name: string; logo: ExpandedAsset }> | null }
>

function rowOf({ data, expanded }: JobHit): JobRow | undefined {
  const company = expanded.company?.data
  if (!company?.name) return undefined // its company isn't published any more
  return {
    slug: data.slug,
    title: data.title,
    type: data.type,
    workplace: data.workplace,
    location: data.location,
    salary: { min: data.salary_min, max: data.salary_max, currency: data.salary_currency },
    postedOn: new Date(data.posted_on * 1000).toISOString().slice(0, 10),
    company: { name: company.name, logo: company.logo?.image_url ?? null },
  }
}

/** What the list and the filters show: the jobs, how many there are, and each facet's values with their counts. */
interface View {
  /** Whether these are search results (words or filters), or the latest jobs. */
  searched: boolean
  rows: JobRow[]
  total: number
  /** Whether search has more results than the rows so far. */
  more: boolean
  facets: { name: string; attribute: string; values: [string, number][] }[]
}

/** The view of the site's own jobs: all of them, newest first, as the page was rendered. */
function viewOfJobs(jobs: BoardJob[]): View {
  return {
    searched: false,
    rows: jobs,
    total: jobs.length,
    more: false,
    facets: facets.map(({ name, attribute, valueOf }) => {
      const counts = new Map<string, number>()
      for (const job of jobs) counts.set(valueOf(job), (counts.get(valueOf(job)) ?? 0) + 1)
      return { name, attribute, values: [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)) }
    }),
  }
}

/**
 * The jobs, newest first, with a search box and filters that narrow them
 * down, searched with Nohead's public search. The page renders the site's own
 * list; search takes over in the browser once the visitor searches or filters.
 */
export function JobSearch({ jobs, search }: { jobs: BoardJob[]; search: Search }) {
  // Finite pagination, so search counts its results exactly.
  const [searchClient] = useState(
    () => instantMeiliSearch(SEARCH_URL, search.token, { finitePagination: true }).searchClient
  )
  // Newest first, also when searching for words.
  const indexName = `${search.index}:data.posted_on:desc`

  // The connection to search opens as the page loads (Next.js sends it as a
  // Link header), before the board's first search needs it.
  preconnect(SEARCH_URL, { crossOrigin: "anonymous" })

  // A search nobody sees, made once as the visitor reaches for search (the
  // search box, the filters): the browser's CORS check and the facet counts
  // instant-meilisearch fetches before its first search happen then, so the
  // visitor's first search takes one round trip instead of three.
  const warmed = useRef(false)
  const warmUp = () => {
    if (warmed.current) return
    warmed.current = true
    // InstantSearch types search() for every search client; instant-meilisearch's takes these requests.
    const searchAll = searchClient.search as (
      requests: { indexName: string; params: object }[]
    ) => Promise<unknown>
    searchAll([{ indexName, params: { query: "", hitsPerPage: 0 } }]).catch(() => {})
  }

  return (
    // Empty initial results: InstantSearch renders at once, on the server too,
    // and doesn't search until the visitor does. Until then the board shows the
    // site's own jobs, which already are what an empty search would find.
    <InstantSearchSSRProvider initialResults={{}}>
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure filters={search.filter} hitsPerPage={HITS_PER_PAGE} />
        {facets.map(({ attribute }) => (
          <Facet key={attribute} attribute={attribute} />
        ))}
        <Board jobs={jobs} onIntent={warmUp} />
      </InstantSearch>
    </InstantSearchSSRProvider>
  )
}

/** Asks search to count a facet's values; the board shows them. */
function Facet({ attribute }: { attribute: string }) {
  useRefinementList({ attribute, limit: 100 })
  return null
}

function Board({ jobs, onIntent }: { jobs: BoardJob[]; onIntent: () => void }) {
  const { results, status, indexUiState, setIndexUiState } = useInstantSearch()
  // Words are searched for once typing pauses, not at every keystroke: no
  // counts for half-typed words, and fewer requests. A filter, Clear search or
  // the address changing searches at once, so they drop a search still waiting.
  const waiting = useRef<ReturnType<typeof setTimeout>>(undefined)
  // One function for good: a new one each render would set the search box up again, endlessly.
  const [queryHook] = useState(() => (query: string, search: (query: string) => void) => {
    clearTimeout(waiting.current)
    waiting.current = setTimeout(() => search(query), 150)
  })
  const { refine: searchFor } = useSearchBox({ queryHook })
  useEffect(() => () => clearTimeout(waiting.current), [])
  // Search's results so far, a page at a time.
  const { items, isLastPage, showMore } = useInfiniteHits()
  // After Show more, focus moves to the first job it added: the button may be gone.
  const list = useRef<HTMLElement>(null)
  const firstAdded = useRef<number | null>(null)
  // What's in the search box, at once; the list follows when search answers.
  const [text, setText] = useState("")
  // On small screens the filters fold away behind a button.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersId = useId()

  // The search and the filters are kept in the page's address, so Back from a
  // job returns to them and a filtered list can be shared. The board replaces
  // the address as the visitor searches and filters (without a history entry
  // for each keystroke or click), and follows it when it changes some other
  // way (<Address>, below): on arriving, on Back, or by a link, such as the
  // site's name to the bare page.
  // The address the board wrote last, so its own changes aren't applied again.
  const written = useRef("")
  const remember = (chosen: Partial<Chosen>) => {
    written.current = searchOf(chosen)
    history.replaceState(null, "", `${location.pathname}${written.current}`)
  }
  // Words are written once typing pauses, or as the box loses focus (to a
  // click on a job, say): Safari stops a page that changes its address more
  // than 100 times in 10 seconds.
  const typed = useRef<{ chosen: Partial<Chosen>; timer: ReturnType<typeof setTimeout> }>(undefined)
  const writeTyped = () => {
    if (!typed.current) return
    clearTimeout(typed.current.timer)
    remember(typed.current.chosen)
    typed.current = undefined
  }
  useEffect(() => () => clearTimeout(typed.current?.timer), [])
  const apply = (search: string) => {
    clearTimeout(waiting.current)
    written.current = search
    const chosen = chosenOf(search)
    setText(chosen.query)
    setIndexUiState((state) => ({ ...state, ...chosen }))
  }
  // On arriving, Back included: Next.js may keep the page's state, but search starts over.
  const arrive = (search: string) => {
    written.current = search
    if (search === "") setText("")
    else apply(search)
  }
  const follow = (search: string) => {
    if (search !== written.current) apply(search)
  }

  // The site's own jobs as a view: the list before any search, and each facet's values in the board's order.
  const own = useMemo(() => viewOfJobs(jobs), [jobs])

  // Without words or filters, the site's own jobs, as the server rendered them;
  // also when search fails, rather than the results of the search before.
  const view = useMemo<View>(() => {
    const searched =
      status !== "error" &&
      results &&
      !results.__isArtificial &&
      (results.query.trim() !== "" || results.getRefinements().length > 0)
    if (!searched) return own
    return {
      searched,
      // Search sorts by the day posted; jobs posted the same day then go by
      // title, as in the site's own list. Page by page, so Show more adds its
      // jobs after the ones shown.
      rows: (items as unknown as JobHit[])
        .map((hit, index) => ({ page: Math.floor(index / HITS_PER_PAGE), row: rowOf(hit) }))
        .filter((hit): hit is { page: number; row: JobRow } => hit.row !== undefined)
        .sort((a, b) => a.page - b.page || newestFirst(a.row, b.row))
        .map(({ row }) => row),
      total: results.nbHits,
      more: !isLastPage,
      // Every value the board has, in the board's own order, each with its count
      // among the results, 0 for none: the filters keep their places as they narrow.
      facets: own.facets.map(({ name, attribute, values }) => {
        const counts = new Map(
          ((results.getFacetValues(attribute, {}) ?? []) as { name: string; count: number }[]).map(
            ({ name, count }) => [name, count]
          )
        )
        // A value search knows and the page didn't (a job published since it was rendered) goes last.
        const known = new Set(values.map(([value]) => value))
        const added = [...counts.keys()].filter((value) => !known.has(value)).sort()
        return {
          name,
          attribute,
          values: [...values.map(([value]) => value), ...added].map(
            (value) => [value, counts.get(value) ?? 0] as [string, number]
          ),
        }
      }),
    }
  }, [results, status, items, isLastPage, own])

  // New results animate the list and the filters: a "filter" transition, with
  // React's <ViewTransition>. It can drop a keystroke while the list animates
  // (react/react#37997), a cost taken for the animation.
  const [shown, setShown] = useState(view)
  useEffect(() => {
    if (view === shown) return
    startTransition(() => {
      addTransitionType("filter")
      setShown(view)
    })
  }, [view, shown])
  useEffect(() => {
    if (firstAdded.current === null || shown.rows.length <= firstAdded.current) return
    list.current?.querySelectorAll<HTMLElement>("a[href^='/jobs/']")[firstAdded.current]?.focus()
    firstAdded.current = null
  }, [shown])

  const refinements = indexUiState.refinementList ?? {}
  const chosen = Object.values(refinements).flat().length
  const filtered = text.trim() !== "" || chosen > 0
  // Search couldn't answer (it's down, or its token was refused): the list stays the site's own jobs, and says so.
  const failed = filtered && status === "error"

  const toggle = (attribute: string, value: string, on: boolean) => {
    clearTimeout(waiting.current)
    const values = (indexUiState.refinementList?.[attribute] ?? []).filter((v) => v !== value)
    const refinementList = { ...indexUiState.refinementList, [attribute]: on ? [...values, value] : values }
    // With the words in the box, which search may not have yet.
    setIndexUiState((state) => ({ ...state, query: text, refinementList }))
    remember({ ...indexUiState, query: text, refinementList })
  }

  const type = (query: string) => {
    setText(query)
    searchFor(query)
    clearTimeout(typed.current?.timer)
    typed.current = { chosen: { ...indexUiState, query }, timer: setTimeout(writeTyped, 300) }
  }

  const clear = () => {
    clearTimeout(waiting.current)
    setText("")
    setIndexUiState((state) => ({ ...state, query: "", refinementList: {} }))
    remember({})
  }

  return (
    <>
      {/* Read in the browser only: the page around it is prerendered without an address. */}
      <Suspense fallback={null}>
        <Address onArrive={arrive} onChange={follow} />
      </Suspense>
      <div className="flex gap-3 sm:max-w-sm" onPointerEnter={onIntent} onFocus={onIntent}>
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
          {chosen ? `Filters (${chosen})` : "Filters"}
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
          onPointerEnter={onIntent}
          onFocus={onIntent}
          className={`grid transition-[grid-template-rows,opacity,visibility] duration-200 ease-out motion-reduce:transition-none md:visible md:grid-rows-[1fr] md:opacity-100 ${filtersOpen ? "visible grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}
        >
          {/* A little room on every side keeps the checkboxes' focus rings from being cut off. */}
          <div className="-m-1 min-h-0 overflow-hidden p-1 md:overflow-visible">
            <div className="grid grid-cols-2 gap-6 pb-8 sm:grid-cols-3 md:flex md:flex-col md:pb-0">
              {shown.facets.map(({ name, attribute, values }) => (
                <FacetValues
                  key={attribute}
                  name={name}
                  values={values}
                  selected={refinements[attribute] ?? []}
                  onToggle={(value, on) => toggle(attribute, value, on)}
                />
              ))}
            </div>
          </div>
        </div>
        <section ref={list} aria-labelledby={`${filtersId}-results`} className="md:col-start-2">
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
          {failed && (
            <p role="alert" className="text-destructive mb-3 text-sm">
              Search isn&apos;t working right now, so these are all the open jobs. Try again in a minute.
            </p>
          )}
          {shown.rows.length > 0 || !shown.searched ? (
            <>
              <JobList jobs={shown.rows} />
              {shown.more && (
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-6 h-10 px-5"
                  onClick={() => {
                    firstAdded.current = shown.rows.length
                    showMore()
                  }}
                >
                  Show more jobs
                </Button>
              )}
            </>
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
