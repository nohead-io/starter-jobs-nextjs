import { notFound } from "next/navigation"
import { getJob, getJobs } from "@/lib/content"
import { paramsOf } from "@/lib/static-params"
import { placeOf, salaryOf } from "@/lib/format"
import { colors, logoOf, shareImage, size } from "@/lib/og"

export { size }
export const contentType = "image/png"
export const alt = "The job's title, its company, and where it's done for how much"

export async function generateStaticParams() {
  return paramsOf(await getJobs())
}

/** A job's share image: its company, its title, and where it's done for how much. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const job = await getJob((await params).slug)
  if (!job) notFound()
  const { company } = job
  const logo = company.logo && (await logoOf(company.logo, 144))
  const facts = `${placeOf(job)}, ${salaryOf(job.salary)} a year, ${job.type.toLowerCase()}`
  return shareImage(
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
        {logo ? (
          <img src={logo} width={64} height={64} alt="" style={{ borderRadius: 16 }} />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#eef0f4",
              color: colors.muted,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {Array.from(company.name)[0]}
          </div>
        )}
        <div style={{ fontSize: 34, fontWeight: 700 }}>{company.name}</div>
      </div>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.8, maxWidth: 1000 }}>
        {job.title}
      </div>
      <div style={{ marginTop: 20, fontSize: 36, color: colors.muted }}>{facts}</div>
    </div>,
    { bold: company.name + job.title + Array.from(company.name)[0], regular: facts }
  )
}
