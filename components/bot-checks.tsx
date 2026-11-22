/** A field people never see, inside a form: bots fill in every field they find (lib/bot-checks.ts). */
export function Honeypot() {
  return (
    <input
      type="text"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="hidden"
    />
  )
}
