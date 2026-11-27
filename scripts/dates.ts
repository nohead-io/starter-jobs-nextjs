/**
 * The jobs' dates, moved forward together so the newest was posted today: the
 * demo jobs stay open, and recent. Never moves them back.
 */
export function movedForward(postedOn: string[]) {
  const day = 24 * 60 * 60 * 1000
  const newest = Math.max(...postedOn.map((date) => Date.parse(date)))
  const shift = Math.max(0, Math.floor((Date.now() - newest) / day)) * day
  return (date: string) => new Date(Date.parse(date) + shift).toISOString().slice(0, 10)
}
