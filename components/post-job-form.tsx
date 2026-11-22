"use client"

import { ChevronDown, ImageUp, Plus } from "lucide-react"
import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { flushSync } from "react-dom"
import type { PostField, PostState } from "@/app/post/actions"
import { Honeypot } from "@/components/bot-checks"
import { PillTabsList, tabPanel, tabsRoot } from "@/components/animated-tabs"
import { CompanyLogo } from "@/components/company-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { InputGroup, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Category, Company, JobChoices } from "@/lib/content"
import { LOGO_TYPES, logoProblem } from "@/lib/logo-limits"

/** For values that don't change while the page is open: nothing to subscribe to. */
const unchanging = () => () => {}

/** 30 days from today, by the visitor's calendar (YYYY-MM-DD). */
function inThirtyDays() {
  const day = new Date()
  day.setDate(day.getDate() + 30)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

/** Today in UTC (YYYY-MM-DD). */
const todayInUtc = () => new Date().toISOString().slice(0, 10)

const labels: Record<PostField, string> = {
  title: "Job title",
  category: "Category",
  type: "Type",
  workplace: "Workplace",
  location: "Location",
  salary_min: "Salary from",
  salary_max: "Salary to",
  salary_currency: "Currency",
  closes_on: "Last day to apply",
  summary: "Summary",
  description: "Description",
  company: "Company",
  company_name: "Company name",
  company_website: "Website",
  company_about: "Company description",
  company_logo: "Logo",
  name: "Your name",
  email: "Your email",
  note: "Note for the reviewer",
}

const input = "h-10 px-3"
// Each section's heading, with a line running from it to the edge: two sizes up from shadcn's
// legend, set on its variant as shadcn sets the size it replaces.
const legend =
  "mb-5 flex w-full items-center gap-4 font-semibold tracking-tight after:h-px after:flex-1 after:bg-border data-[variant=legend]:text-xl"
// 16px text on phones, as shadcn's inputs have: Safari on iPhone zooms in on a smaller field when it's tapped.
const select = "w-full [&>select]:h-10 [&>select]:pl-3 [&>select]:text-base md:[&>select]:text-sm"

/** The form that posts a job for review, sent by a server action. */
export function PostJobForm({
  action,
  companies,
  categories,
  choices,
}: {
  action: (previous: PostState, form: FormData) => Promise<PostState>
  companies: Pick<Company, "slug" | "name" | "logo">[]
  categories: Pick<Category, "slug" | "name">[]
  choices: JobChoices
}) {
  const [state, send, sending] = useActionState(action, { sent: false })
  // Whether the job is for a new company, whose fields then show, or one on the board, chosen from cards.
  const [newCompany, setNewCompany] = useState(false)
  const id = useId()

  const form = useRef<HTMLFormElement>(null)
  const formError = useRef<HTMLParagraphElement>(null)

  // Sent from here rather than by the form's action, which would reset the
  // form after each try, emptying the logo chosen and the selects. Without
  // JavaScript the action still sends it, and what the server sends back
  // fills it in again (off Vercel: BotID needs JavaScript).
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => send(data))
  }

  // The new company's logo: a preview of the file chosen, and whether a file is being dragged over the box.
  const [logoPreview, setLogoPreview] = useState<{ url: string; name: string; size: string } | null>(null)
  const [dragging, setDragging] = useState(false)
  // Each preview's address is let go once it's replaced or the form is gone.
  useEffect(() => {
    if (!logoPreview) return
    return () => URL.revokeObjectURL(logoPreview.url)
  }, [logoPreview])

  /** Takes the file chosen or dropped: checked at once, by the same rules as the server's, and previewed. */
  const chooseLogo = (input: HTMLInputElement) => {
    const file = input.files?.[0] ?? null
    const problem = file && logoProblem(file)
    input.setCustomValidity(problem ? `The logo ${problem}.` : "")
    setLogoPreview(
      file && !problem
        ? {
            url: URL.createObjectURL(file),
            name: file.name,
            size:
              file.size < 1_000_000
                ? `${Math.ceil(file.size / 1000)} KB`
                : `${(file.size / 1_000_000).toFixed(1)} MB`,
          }
        : null
    )
    if (problem) input.reportValidity()
  }

  // The last day to apply starts 30 days from today, by the visitor's own
  // calendar, and can be no earlier than today in UTC, the board's own day: a
  // job closing before it would never be listed. Both are worked out in the
  // browser, as the page is prerendered: empty until then.
  const inAMonth = useSyncExternalStore(unchanging, inThirtyDays, () => "")
  const earliest = useSyncExternalStore(unchanging, todayInUtc, () => undefined)

  // Send is disabled while sending, which takes focus from it: after a try,
  // focus goes to the first field with a problem, or to the form's problem,
  // and its message is read out.
  useEffect(() => {
    const target = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? formError.current
    target?.focus()
  }, [state])

  if (state.sent) {
    return (
      // Focused as it takes the form's place, which takes the Send button with it.
      <div
        role="status"
        tabIndex={-1}
        ref={(message) => message?.focus()}
        className="bg-muted/60 rounded-xl p-5 outline-none"
      >
        <p className="font-semibold">
          {state.posted
            ? `${state.posted.title} at ${state.posted.company} is waiting for review`
            : "Job sent"}
        </p>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">
          Once it&apos;s reviewed and published, it shows on the board. On this demo nobody reviews jobs:
          they&apos;re deleted regularly.
        </p>
      </div>
    )
  }

  /** A field's label, input, hint and error, with the hint and the error read out with it. */
  const field = (
    name: PostField,
    control: (props: object) => React.ReactNode,
    { hint, optional = false }: { hint?: string; optional?: boolean } = {}
  ) => {
    const error = state.errors?.[name]
    const described = [hint && `${id}-${name}-hint`, error && `${id}-${name}-error`].filter(Boolean).join(" ")
    return (
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={`${id}-${name}`}>
          {labels[name]}
          {optional && <span className="text-muted-foreground font-normal">(optional)</span>}
        </FieldLabel>
        {control({
          id: `${id}-${name}`,
          name,
          // Empty to start with, so a select shows its "Choose" placeholder rather than its first choice.
          defaultValue: state.values?.[name] ?? "",
          "aria-invalid": error ? true : undefined,
          "aria-describedby": described || undefined,
        })}
        {hint && <FieldDescription id={`${id}-${name}-hint`}>{hint}</FieldDescription>}
        {error && (
          <FieldError id={`${id}-${name}-error`}>
            {labels[name]} {error}.
          </FieldError>
        )}
      </Field>
    )
  }

  /**
   * The salary range and its currency, as one field: "from", "to" and the
   * currency in one box, each named for screen readers, under one label.
   */
  const salary = () => {
    const parts = ["salary_min", "salary_max", "salary_currency"] as const
    const errors = parts.filter((name) => state.errors?.[name])
    const control = (name: (typeof parts)[number]) => ({
      id: `${id}-${name}`,
      name,
      required: true,
      defaultValue: state.values?.[name] ?? "",
      "aria-label": labels[name],
      "aria-invalid": state.errors?.[name] ? true : undefined,
      "aria-describedby": state.errors?.[name] ? `${id}-${name}-error` : undefined,
    })
    // Numbers without the browser's up and down buttons.
    const figure =
      "min-w-0 px-3 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    return (
      <Field data-invalid={errors.length > 0 ? true : undefined}>
        <FieldLabel id={`${id}-salary`} htmlFor={`${id}-salary_min`}>
          Yearly salary
        </FieldLabel>
        <InputGroup aria-labelledby={`${id}-salary`} className="h-10">
          {/* A control of the group, not an addon: an addon passes a click on to the first input. */}
          <span className="relative flex h-full shrink-0 items-center border-r">
            <select
              {...control("salary_currency")}
              // USD to start with, when the content model offers it; what was sent back after a try otherwise.
              defaultValue={
                state.values?.salary_currency ||
                (choices.currencies.includes("USD") ? "USD" : choices.currencies[0])
              }
              data-slot="input-group-control"
              className="h-full appearance-none rounded-l-lg bg-transparent pr-7 pl-3 text-base outline-none md:text-sm [&>option]:bg-[Canvas] [&>option]:text-[CanvasText]"
            >
              {choices.currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute right-2 size-3.5"
            />
          </span>
          <InputGroupInput
            {...control("salary_min")}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="65000"
            className={figure}
          />
          <InputGroupText aria-hidden="true">to</InputGroupText>
          <InputGroupInput
            {...control("salary_max")}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="85000"
            className={figure}
          />
        </InputGroup>
        {errors.map((name) => (
          <FieldError key={name} id={`${id}-${name}-error`}>
            {labels[name]} {state.errors?.[name]}.
          </FieldError>
        ))}
      </Field>
    )
  }

  /**
   * The new company's logo: a box to click or drop the file on, showing the
   * logo once chosen. The file input lies over the whole box, invisible, so
   * the file is sent with the form and the browser's checks point at the box.
   */
  const logoField = () => {
    const error = state.errors?.company_logo
    const described = [`${id}-company_logo-hint`, error && `${id}-company_logo-error`]
      .filter(Boolean)
      .join(" ")
    return (
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={`${id}-company_logo`}>{labels.company_logo}</FieldLabel>
        <div
          className={`has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-aria-invalid:border-destructive relative flex items-center gap-4 rounded-lg border border-dashed p-3 transition-colors has-focus-visible:ring-3 ${dragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
        >
          <input
            id={`${id}-company_logo`}
            type="file"
            name="company_logo"
            required
            accept={LOGO_TYPES.join(",")}
            aria-invalid={error ? true : undefined}
            aria-describedby={described}
            onChange={(event) => chooseLogo(event.currentTarget)}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <span className="bg-foreground/5 grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl">
            {logoPreview ? (
              // A file on the visitor's own computer: there's nothing for next/image to optimize.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview.url} alt="" className="size-full object-cover" />
            ) : (
              <ImageUp aria-hidden="true" className="text-muted-foreground size-5" />
            )}
          </span>
          <span className="min-w-0 text-sm">
            <span className="block truncate font-medium">
              {logoPreview ? (
                logoPreview.name
              ) : (
                // Dropping a file needs a mouse or a trackpad: phones get only the choosing.
                <>
                  Choose a logo<span className="hidden pointer-fine:inline">, or drop it here</span>
                </>
              )}
            </span>
            <span id={`${id}-company_logo-hint`} className="text-muted-foreground block">
              {logoPreview
                ? `${logoPreview.size}. Choose another to replace it.`
                : "Square, as an SVG, PNG, JPEG or WebP image of up to 2 MB."}
            </span>
          </span>
        </div>
        {error && (
          <FieldError id={`${id}-company_logo-error`}>
            {labels.company_logo} {error}.
          </FieldError>
        )}
      </Field>
    )
  }

  /** A select's options, as [value, label], after a placeholder to choose from. */
  const options = (entries: [string, string][], placeholder: string) => [
    <NativeSelectOption key="" value="" disabled>
      {placeholder}
    </NativeSelectOption>,
    ...entries.map(([value, label]) => (
      <NativeSelectOption key={value} value={value}>
        {label}
      </NativeSelectOption>
    )),
  ]
  const same = (values: string[]) => values.map((value): [string, string] => [value, value])

  return (
    // Three sections and one Send: the browser checks every field before sending, and shows the first problem.
    <form ref={form} action={send} onSubmit={submit} className="flex flex-col gap-12">
      <FieldSet className="gap-6">
        <FieldLegend className={legend}>About the job</FieldLegend>
        {field("title", (props) => (
          <Input
            {...props}
            required
            maxLength={120}
            placeholder="Senior Backend Engineer"
            className={input}
          />
        ))}
        <div className="grid gap-6 sm:grid-cols-2">
          {field("category", (props) => (
            <NativeSelect {...props} required className={select}>
              {options(
                categories.map(({ slug, name }) => [slug, name]),
                "Choose a category"
              )}
            </NativeSelect>
          ))}
          {field("type", (props) => (
            <NativeSelect {...props} required className={select}>
              {options(same(choices.types), "Choose a type")}
            </NativeSelect>
          ))}
          {field("workplace", (props) => (
            <NativeSelect {...props} required className={select}>
              {options(same(choices.workplaces), "Choose a workplace")}
            </NativeSelect>
          ))}
          {field("location", (props) => (
            <Input
              {...props}
              required
              maxLength={60}
              placeholder="A region, Worldwide, or the office's city"
              className={input}
            />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {salary()}
          {field("closes_on", (props) => (
            <Input
              {...props}
              defaultValue={state.values?.closes_on || inAMonth}
              type="date"
              min={earliest}
              required
              // Without the system's look, which on iPhones keeps the field wider than the page; the date on the left, as in the other fields.
              className={`${input} appearance-none [&::-webkit-date-and-time-value]:text-left`}
            />
          ))}
        </div>
        {field("summary", (props) => (
          <Textarea
            {...props}
            required
            maxLength={200}
            placeholder="One sentence, shown in lists and link previews"
            className="min-h-20 px-3 py-2.5"
          />
        ))}
        {field("description", (props) => (
          <Textarea
            {...props}
            required
            // The content model's (nohead.schema.yaml). Nohead counts the text without its Markdown, so what fits here fits there.
            maxLength={10_000}
            placeholder="Markdown works, such as ## for headings and - for lists"
            className="min-h-64 px-3 py-2.5"
          />
        ))}
      </FieldSet>

      <FieldSet className="gap-6">
        <FieldLegend className={legend}>About the company</FieldLegend>
        {/* Existing or new: two tabs, a pill sliding between them, and their panes sliding in. */}
        <Tabs
          value={newCompany ? "new" : "existing"}
          onValueChange={(value: string) => setNewCompany(value === "new")}
          className={tabsRoot}
        >
          <PillTabsList
            label="Is the company on the board already?"
            tabs={[
              ["existing", "Existing company"],
              ["new", "New company"],
            ]}
          />
          {/*
                Both panes stay in the form, the other one hidden and disabled:
                a disabled field is neither checked nor sent, and what was
                chosen or typed is still there on switching back.
              */}
          <TabsContent value="existing" keepMounted tabIndex={-1} className={`pt-6 ${tabPanel}`}>
            <fieldset disabled={newCompany} className="flex min-w-0 flex-col gap-3">
              <fieldset
                aria-describedby={state.errors?.company ? `${id}-company-error` : undefined}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                <legend className="sr-only">Choose the company</legend>
                {companies.map((company) => (
                  <label
                    key={company.slug}
                    className="hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary/5 has-checked:outline-primary has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm font-medium -outline-offset-1 transition-colors has-checked:outline-2 has-focus-visible:ring-3 sm:gap-3 sm:p-3"
                  >
                    {/* Over the whole card, invisible: the card is what's clicked, and the browser's "choose one" points at it. */}
                    <input
                      type="radio"
                      name="company"
                      value={company.slug}
                      required
                      defaultChecked={state.values?.company === company.slug}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <CompanyLogo company={company} size={32} className="rounded-lg" />
                    {/* Wrapped, not cut short: a long name is still read in full. */}
                    <span className="min-w-0 [overflow-wrap:anywhere]">{company.name}</span>
                  </label>
                ))}
                {/* The last card: not a company, the way to add one. */}
                <button
                  type="button"
                  // Disabled with its pane as the other one opens: focus goes on to the new company's name.
                  onClick={() => {
                    flushSync(() => setNewCompany(true))
                    document.getElementById(`${id}-company_name`)?.focus()
                  }}
                  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg border border-dashed p-2.5 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-3 sm:gap-3 sm:p-3"
                >
                  <span className="bg-foreground/5 grid size-8 shrink-0 place-items-center rounded-lg">
                    <Plus aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">New company</span>
                </button>
              </fieldset>
              {state.errors?.company && (
                <FieldError id={`${id}-company-error`}>
                  {labels.company} {state.errors.company}.
                </FieldError>
              )}
            </fieldset>
          </TabsContent>
          <TabsContent value="new" keepMounted tabIndex={-1} className={`pt-6 ${tabPanel}`}>
            <fieldset disabled={!newCompany} className="flex min-w-0 flex-col gap-6">
              {/* Not a slug any company can have (slugify never makes a "+"), so it can't be mistaken for one. */}
              <input type="hidden" name="company" value="+new" />
              <div className="grid gap-6 sm:grid-cols-2">
                {field("company_name", (props) => (
                  <Input {...props} required maxLength={80} placeholder="Harbourlight" className={input} />
                ))}
                {field("company_website", (props) => (
                  <Input {...props} type="url" required placeholder="https://example.com" className={input} />
                ))}
              </div>
              {field("company_about", (props) => (
                <Textarea
                  {...props}
                  required
                  maxLength={300}
                  placeholder="What it makes, and for whom, in a sentence or two"
                  className="min-h-24 px-3 py-2.5"
                />
              ))}
              {logoField()}
            </fieldset>
          </TabsContent>
        </Tabs>
      </FieldSet>

      <FieldSet className="gap-6">
        <FieldLegend className={legend}>About you</FieldLegend>
        <div className="grid gap-6 sm:grid-cols-2">
          {field("name", (props) => (
            <Input
              {...props}
              required
              maxLength={120}
              autoComplete="name"
              placeholder="Ana Lindqvist"
              className={input}
            />
          ))}
          {field("email", (props) => (
            <Input
              {...props}
              type="email"
              required
              autoComplete="email"
              placeholder="ana@example.com"
              className={input}
            />
          ))}
        </div>
        {field(
          "note",
          (props) => (
            <Textarea
              {...props}
              maxLength={2000}
              placeholder="Anything the reviewer should know"
              className="min-h-24 px-3 py-2.5"
            />
          ),
          { optional: true }
        )}
      </FieldSet>

      <div className="flex flex-col gap-6">
        {state.error && (
          <p ref={formError} role="alert" tabIndex={-1} className="text-destructive text-sm outline-none">
            {state.error}
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="h-10 w-full px-6 sm:w-auto sm:self-start"
          disabled={sending}
        >
          {sending && <Spinner aria-hidden="true" data-icon="inline-start" />}
          {sending ? "Sending…" : "Send for review"}
        </Button>
      </div>
      <Honeypot />
    </form>
  )
}
