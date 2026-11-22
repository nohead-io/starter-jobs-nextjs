import { checkBotId } from "botid/server"

// The application form is open to anyone, so bots are kept out twice: a
// field people never see (bots fill in every field they find, and
// components/bot-checks.tsx puts it in the form), and, on Vercel, Vercel
// BotID, which checks the visitor's browser without asking them anything
// (instrumentation-client.ts names the form it watches).

/**
 * Whether a form looks like a person sent it. A bot that fills in the hidden
 * field is told its form was sent, so it doesn't try again; one BotID spots is
 * refused, as BotID could take a person for one, who can then try again.
 */
export async function verdictOf(form: FormData): Promise<"person" | "bot" | "refused"> {
  if (String(form.get("website") ?? "")) return "bot"
  // BotID works on Vercel only, where the browser runs it too: by the same
  // variable as instrumentation-client.ts, as a check without the browser's
  // part would refuse everyone. Elsewhere the hidden field is the check.
  if (!process.env.NEXT_PUBLIC_VERCEL_ENV) return "person"
  try {
    const { isBot } = await checkBotId()
    return isBot ? "refused" : "person"
  } catch (error) {
    // When BotID can't answer, the form goes through rather than turning people away.
    console.error("BotID couldn't check the form:", error)
    return "person"
  }
}
