// Moves the published jobs' dates forward together, so the newest was posted
// today, as `pnpm seed` does when it creates them: the demo jobs stay open,
// and recent, as long as you keep them. Run it with a key that can read and
// write records (records:read, records:write):
//
//   NOHEAD_API_KEY=... pnpm seed:dates
//
// Each job it moves is a published edit, so the site's webhook refreshes it.
// On a day the newest job was already posted, it changes nothing.
import { Nohead } from "@nohead/sdk"
import { movedForward } from "./dates.ts"

// The SDK reads NOHEAD_API_KEY (and NOHEAD_API_URL) itself.
const nohead = new Nohead()

const jobs = await Array.fromAsync(
  nohead.records.list<{ posted_on: string; closes_on: string }>("jobs", {
    filter: { published_at: { exists: true } },
  })
)
const moved = movedForward(jobs.map((job) => job.data.posted_on))
let count = 0
for (const job of jobs) {
  const { posted_on, closes_on } = job.data
  if (moved(posted_on) === posted_on) continue
  await nohead.records.update(
    job.id,
    { data: { posted_on: moved(posted_on), closes_on: moved(closes_on) } },
    {
      ifMatch: job.revision,
      changeNote: "Moved forward with the other jobs, so the newest was posted today.",
    }
  )
  count++
}
console.log(`jobs: ${count} moved forward, ${jobs.length - count} already current`)
