// The application form is open to anyone, so bots are kept out by a field
// people never see: bots fill in every field they find, and
// components/bot-checks.tsx puts it in the form.

/** Whether a bot sent the form: it filled in the hidden field. */
export function sentByBot(form: FormData) {
  return String(form.get("website") ?? "") !== ""
}
