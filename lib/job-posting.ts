import type { JobPosting, WithContext } from "schema-dts"
import type { Job } from "./content"
import { siteUrl } from "./site"

const employmentTypes: Record<string, string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
}

/**
 * A job as Google for Jobs reads it: schema.org's JobPosting, which the job's
 * page carries as JSON-LD. Google lists open jobs from it in its job search,
 * and drops a job after its closing date (validThrough).
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 * Typed by schema-dts, schema.org's types for TypeScript: a misspelt property
 * fails the type check, not Google's.
 */
export function jobPostingOf(job: Job): WithContext<JobPosting> {
  const remote = job.workplace === "Remote"
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.postedOn,
    // Open through its closing day, as on the site.
    validThrough: `${job.closesOn}T23:59:59Z`,
    employmentType: employmentTypes[job.type],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.website,
      // An absolute address, as Google asks.
      logo: job.company.logo ? new URL(job.company.logo, siteUrl).href : undefined,
    },
    // A remote job names where people may work from, unless that's anywhere;
    // a hybrid or on-site one, where its office is. Google asks for countries,
    // which the free-text location doesn't give: it may flag an office
    // without one, or skip a job it can't place.
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          ...(job.location !== "Worldwide" && {
            applicantLocationRequirements: { "@type": "AdministrativeArea", name: job.location },
          }),
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: job.location },
          },
        }),
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: job.salary.currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary.min,
        maxValue: job.salary.max,
        unitText: "YEAR",
      },
    },
    // Applying takes one form, on the job's own page.
    directApply: true,
  }
}
