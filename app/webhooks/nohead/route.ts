// Nohead's webhook: when published content changes, the site's cached
// content (everything tagged "nohead" in lib/content.ts) is cleared, so the
// next visit to each page reads it afresh.
//
// In the Nohead web app, under Webhooks, point a webhook at
// https://<your site>/webhooks/nohead with "Published content only" and
// "All events" on (the content model's changes too: the post form's choices
// are read from it), and set its signing secret as NOHEAD_WEBHOOK_SECRET.
import { unwrapWebhook, WebhookVerificationError } from "@nohead/sdk/webhooks"
import { revalidateTag } from "next/cache"

export async function POST(request: Request) {
  try {
    await unwrapWebhook(await request.text(), request.headers, { secret: process.env.NOHEAD_WEBHOOK_SECRET })
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      // Why, in the server's log only: the reply tells whoever sent it nothing.
      console.warn("A webhook was refused:", error.message)
      return new Response(null, { status: 401 })
    }
    throw error
  }
  // Every event clears everything: one tag, simple and always right. The
  // next request for each page waits for fresh content instead of being
  // served the old one.
  revalidateTag("nohead", { expire: 0 })
  return new Response(null, { status: 204 })
}
