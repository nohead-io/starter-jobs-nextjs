/**
 * What a page's generateStaticParams returns: a slug for each page to build
 * ahead of time. Cache Components needs at least one, so with none, such as
 * on a board with no open jobs, a slug no record can have stands in (slugs
 * are letters, numbers and hyphens), and its page answers Not found.
 */
export function paramsOf(items: { slug: string }[]) {
  return items.length > 0 ? items.map(({ slug }) => ({ slug })) : [{ slug: "_none" }]
}
