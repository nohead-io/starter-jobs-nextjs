import { initBotId } from "botid/client/core"

// Vercel BotID watches the application form, whose server action posts to
// its job's page, so the server can tell a person's browser from a bot's
// (lib/bot-checks.ts). Only on Vercel, which sets NEXT_PUBLIC_VERCEL_ENV
// in its builds: elsewhere BotID's script isn't there, and the form couldn't send.
if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
  initBotId({
    protect: [{ path: "/jobs/*", method: "POST" }],
  })
}
