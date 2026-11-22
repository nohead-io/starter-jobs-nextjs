"use client"

import { Info } from "lucide-react"
import { useActionState, useEffect, useId, useRef } from "react"
import type { ApplyState, Field as FieldName } from "@/app/jobs/[slug]/actions"
import { Honeypot } from "@/components/bot-checks"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

const labels: Record<FieldName, string> = { name: "Name", email: "Email", link: "Link", message: "Message" }

/** The application form on a job's page, sent by a server action. */
export function ApplyForm({
  action,
  company,
}: {
  action: (previous: ApplyState, form: FormData) => Promise<ApplyState>
  company: string
}) {
  const [state, send, sending] = useActionState(action, { sent: false })
  const id = useId()
  const form = useRef<HTMLFormElement>(null)
  const formError = useRef<HTMLParagraphElement>(null)

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
        <p className="font-semibold">Application sent</p>
        <p className="text-muted-foreground mt-1 text-sm text-pretty">
          {company} replies by email. On this demo nobody will: applications are deleted regularly.
        </p>
      </div>
    )
  }

  /** A field's label, input and error, with the error read out with it. */
  const field = (name: FieldName, input: (props: object) => React.ReactNode, hint?: string) => {
    const error = state.errors?.[name]
    return (
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={`${id}-${name}`}>
          {labels[name]}
          {hint && <span className="text-muted-foreground font-normal">{hint}</span>}
        </FieldLabel>
        {input({
          id: `${id}-${name}`,
          name,
          defaultValue: state.values?.[name],
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-${name}-error` : undefined,
        })}
        {error && (
          <FieldError id={`${id}-${name}-error`}>
            {labels[name]} {error}.
          </FieldError>
        )}
      </Field>
    )
  }

  return (
    <form ref={form} action={send} className="flex flex-col gap-6">
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle>This is a demo</AlertTitle>
        <AlertDescription>
          Applications go to its Nohead project and are deleted regularly, so don&apos;t send your real
          details.
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 sm:grid-cols-2">
        {field("name", (props) => (
          <Input {...props} required maxLength={120} autoComplete="name" className="h-10 px-3" />
        ))}
        {field("email", (props) => (
          <Input {...props} type="email" required autoComplete="email" className="h-10 px-3" />
        ))}
      </div>
      {field(
        "link",
        (props) => (
          <Input {...props} type="url" placeholder="https://" autoComplete="url" className="h-10 px-3" />
        ),
        " (optional): a portfolio or a profile"
      )}
      {field("message", (props) => (
        <Textarea {...props} required maxLength={4000} className="min-h-40 px-3 py-2.5" />
      ))}
      <Honeypot />
      {state.error && (
        <p ref={formError} role="alert" tabIndex={-1} className="text-destructive text-sm outline-none">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-10 w-full px-6 sm:w-auto sm:self-start" disabled={sending}>
        {sending && <Spinner aria-hidden="true" data-icon="inline-start" />}
        {sending ? "Sending…" : "Send application"}
      </Button>
    </form>
  )
}
