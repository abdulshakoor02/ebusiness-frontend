This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Appearance

Light mode uses the logo's blue palette with a soft blue-gray canvas, translucent white panels, rounded edges, and frosted navigation and dialogs. It is enabled automatically in light mode, including when the system theme is light. Dark mode and its existing optional Glass Mode setting are unchanged.

The light-only styles live in [light-glass.css](src/app/light-glass.css), imported after the original theme. Every selector is scoped to `html:not(.dark)`. Shared UI slots cover cards, controls, tables, and portaled overlays. Bespoke surfaces use `data-glass` hooks: `panel`, `table-panel`, `inset`, `toolbar`, `upload`, and `table`. New screens should reuse these rather than hard-code opaque backgrounds or add the legacy `.card-glass` class, which also affects dark mode.

Browsers without backdrop-filter receive opaque fallback panels. Reduced-transparency preferences, keyboard focus, validation colors, and document printing remain supported. Invoice and receipt PDF generation is independent of the screen theme.

Run the theme scope and surface coverage checks with:

```bash
node --test tests/light-glass.test.mjs
```

## Live dashboards

The overview uses `GET /api/v1/dashboard/summary?timezone=<IANA zone>` from `ebusiness-backend`. Restart/deploy the backend first so its startup migrations install `dashboard:view` permissions and indexes, then deploy the frontend. `NEXT_PUBLIC_API_URL` must point to the backend's `/api/v1` base URL.

- **Superadmin:** tenant and user growth, platform lead counts, tenant onboarding, and recent tenant summaries. No invented uptime or cross-currency revenue.
- **Tenant admin:** tenant pipeline, net receipt collections, gross invoices and outstanding balances, team counts, appointments, follow-ups, and recent leads.
- **User:** assigned leads, self-organized appointments, self-created follow-ups, and authored comments. No tenant-wide financial or team data.

The backend chooses scope from verified JWT claims. Monthly metrics compare month-to-date with the same elapsed local calendar period last month; snapshots are labelled separately. Today follows the browser's IANA zone. Financial totals use the tenant's configured currency (no USD fallback for unknown currency). Live data refreshes every 60 seconds while visible and via **Refresh**, with loading, empty, retry, and stale-snapshot states. Query caches are keyed by user, tenant, role, and time zone. See the [backend API reference](../ebusiness-backend/api.md#18-dashboard-summary) for exact metric definitions.

Dashboard-specific components and styles preserve the existing glass and dark application backgrounds. Run the contract/helper and theme checks with:

```bash
node --test tests/dashboard.test.mjs tests/light-glass.test.mjs
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
