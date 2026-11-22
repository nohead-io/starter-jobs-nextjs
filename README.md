# Nohead job board starter

![The starter's home page: “Remote jobs at small software companies” above a search box, filters and a list of jobs, each with its company's logo, salary and date](.github/preview.webp)

A job board built with [Next.js](https://nextjs.org) for content kept in [Nohead](https://nohead.io): jobs, the companies hiring and the categories they're in, with search and filters. Copy it, connect it to your own Nohead project, and replace the jobs with your own.

The demo is Elsewhere, a board for remote jobs at small software companies. The companies and jobs are invented.

## What it shows

- **Jobs** with a company, a category, a salary range, where the work happens, and a closing date; a job leaves the site the day after it closes, with nobody unpublishing it.
- **Companies** with a logo and a page listing their open jobs; **categories** with a page each.
- **Search and filters** on the home page, in the browser: type to search, and narrow the jobs by category, type, workplace, location and company, each choice showing how many jobs it leaves. The search and filters are kept in the page's address (`/?q=design&type=Contract`), so Back from a job returns to them and a filtered list can be shared.
- **RSS feeds** of the open jobs, [`/feed.xml`](app/feed.xml/route.ts) and one per category (`/categories/<slug>/feed.xml`), for feed readers, and for email alerts: newsletter tools can email a feed's new items to their subscribers. Their links use `SITE_URL`.
- **An about page**, [`/about`](app/about/page.tsx), linked from the header: what the board is and how it's made. It's written in code, as a board's own story is its own to tell: rewrite it for yours.
- **A sitemap** of the open jobs, companies and categories, [`/sitemap.xml`](app/sitemap.ts), named in [`/robots.txt`](app/robots.ts), with links from `SITE_URL` as the feeds' are.
- **Share images** for the site and each job (its company's logo, title and terms), drawn with `next/og` in the site's typeface ([`lib/og.tsx`](lib/og.tsx)), and the site's icon. Pages point to them at the same address as the feeds' links.
- **Server rendering with Cache Components:** every page is prerendered, its content cached for an hour.

At this step the site reads its content from [`seed/`](seed) (Markdown, YAML and the logos), through one module, [`lib/content.ts`](lib/content.ts), that every page calls.

## The content model

[`nohead.schema.yaml`](nohead.schema.yaml) is the Nohead project's content model as code: the jobs, the companies hiring and the categories the site shows. The [Nohead CLI](https://github.com/nohead-io/nohead-cli) pushes it to a project:

```bash
pnpm nohead login
pnpm nohead schema diff   # what would change
pnpm nohead schema push   # change it
```

`pnpm nohead schema pull` writes the project's model back to the file, after a change made in the web app.

## Step by step

This repository's history builds the site one step at a time. It starts with a plain Next.js site reading its content from [`seed/`](seed), and each commit after it moves one thing onto Nohead:

1. A job board reading seed files
2. The content model as code
3. A seed script for the demo content
4. Reading from Nohead, with no page changing
5. Search with Nohead's public search
6. Applications from visitors
7. Deploying to Vercel
8. Refreshing when content is published
9. Jobs posted by visitors, reviewed before they go live

`git log --reverse` lists them.

## Development

It needs Node 24 or newer and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm check      # types
pnpm lint       # ESLint
pnpm format     # Prettier
```

## Credits

The typeface is [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), under the SIL Open Font License. The interface uses [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), and icons from [Lucide](https://lucide.dev). The companies' logos are made for this demo, except Quillmark's feather, from Font Awesome: [`seed/images/README.md`](seed/images/README.md) credits it.

## License

[MIT](LICENSE). Quillmark's feather keeps its own license, listed in the credits.
