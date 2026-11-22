// Server-side only, like lib/content.ts: the form key never reaches the browser.
import "server-only"
import { Nohead } from "@nohead/sdk"

/**
 * Nohead with the forms' own key, NOHEAD_FORM_KEY (only the records:write
 * and assets:write scopes), which stays on the server; or null when it isn't
 * set, which the server's log then says. Without it the SDK would fall back
 * to NOHEAD_API_KEY, which can't write.
 */
export function formKeyClient() {
  const apiKey = process.env.NOHEAD_FORM_KEY
  if (apiKey) return new Nohead({ apiKey })
  console.error(
    "NOHEAD_FORM_KEY isn't set: create a key with only the records:write and assets:write scopes for the forms."
  )
  return null
}
