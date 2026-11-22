import { initBotId } from "botid/client/core"

// Vercel BotID watches the site's two forms, whose server actions post to
// their pages' addresses, so the server can tell a person's browser from a
// bot's (lib/bot-checks.ts). Only on Vercel, which sets NEXT_PUBLIC_VERCEL_ENV
// in its builds: elsewhere BotID's script isn't there, and the forms couldn't send.
if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
  initBotId({
    protect: [
      { path: "/post", method: "POST" },
      { path: "/jobs/*", method: "POST" },
    ],
  })
}
