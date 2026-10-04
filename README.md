# CoreCraft

Online store for a Bangladeshi clothing brand: heavyweight tees, drop-shoulder
pieces, and premium football and cricket jerseys. Sanity is the content
backend and the team's CMS; Next.js is the storefront.

| Folder | What it is | Dev URL |
| --- | --- | --- |
| `studio/` | Sanity Studio, standalone, two workspaces | http://localhost:3333 |
| `web/` | Next.js 16 App Router storefront | http://localhost:3000 |

The Studio is deliberately standalone rather than embedded in the Next.js app.
It builds on Vite, receives auto-updates without a redeploy, and supports
TypeGen watch mode.

## Sanity project

| Setting | Value |
| --- | --- |
| Project ID | `3krwldhr` |
| `production` dataset | Public. The catalogue: products, categories, brands, collections, services, site settings. |
| `commerce` dataset | Private. Customers, orders, service requests, product interest. Only ever read or written server-side with a token. |

Personal data never lives in the public dataset. Because references cannot
cross datasets, orders snapshot product name and price at purchase time, which
is also what an order should do.

## Getting started

```bash
npm run install:all
cp web/.env.example web/.env.local
npm run dev
```

Then fill in `web/.env.local`:

| Variable | Needed for |
| --- | --- |
| `SANITY_API_READ_TOKEN` | Draft previews and Presentation Tool. Viewer role. |
| `SANITY_API_WRITE_TOKEN` | Checkout, enquiries and notify-me. Editor role. Without it the forms explain that ordering is not switched on. |

Create both at https://www.sanity.io/manage/project/3krwldhr/api. Restart the
dev server after changing them. Do not run `npm run build:web` while
`next dev` is running; they share `.next` and the dev cache goes stale.

## Studio

Two workspaces, one Studio:

- **Content** (`/content`): Site settings pinned at the top, then products
  filtered by live, not yet live, sold out, featured, archived and by garment
  type, then categories, collections, brands and services. Every product has
  an **Insights** tab that reads interest signals, orders, units sold, revenue
  and size demand from the commerce dataset. Presentation Tool previews the
  storefront with click-to-edit.
- **Commerce** (`/commerce`): orders grouped by what needs doing and by
  payment state, service requests by stage, product interest grouped live per
  product. **Customers** appear only for administrators; the allowed roles are
  one constant in `studio/structure/commerce.ts`.

Built-in roles are Administrator, Editor and Viewer. Custom roles need a
Growth plan.

After changing a schema:

```bash
cd studio && npx sanity schemas deploy && npm run typegen
```

## Storefront architecture

`web/src` follows Clean Architecture. Dependencies point inward only.

| Layer | Folder | Rule |
| --- | --- | --- |
| Domain | `core/domain` | Entities, value objects and business rules. No framework, no Sanity. |
| Ports | `core/ports` | Interfaces the application needs: repositories, image URLs, payment gateway. |
| Application | `application/use-cases` | One file per use case. Orchestrates ports, enforces rules, throws domain errors. |
| Infrastructure | `infrastructure` | Sanity clients, GROQ (only in `sanity/queries.ts`), mappers, the manual payment gateway, env reading. |
| Presentation | `presentation`, `app` | View models that pre-format every string, components that take plain props, zod schemas at the boundary, server actions, thin route files. |
| Composition | `composition/container.ts` | The only module that knows both ports and adapters. |

Money is never trusted from the browser. `placeOrder` re-reads every price
from the catalogue, checks stock, applies the printing fee and delivery rate
from site settings, and computes totals itself.

### Payments

The manual gateway covers cash on delivery, bKash, Nagad and bank transfer by
giving the shopper instructions and recording the order as awaiting payment.
The team confirms payment in the Studio. A provider integration (bKash
merchant API, SSLCommerz, Stripe) is a new adapter implementing
`core/ports/payment-gateway.ts`, registered in the container.

## Content model

| Type | Dataset | Purpose |
| --- | --- | --- |
| `product` | production | Garment with type, fabric, GSM, fit, care, size chart, jersey fields, price, variants |
| `productVariant` | production | Size and colour with a hex swatch, own SKU, price override and stock |
| `category`, `brand`, `collection`, `service` | production | Taxonomy, label, curated shelf, made-to-order work |
| `siteSettings` | production | Singleton: brand copy, contact, delivery charges, payment methods, print fee, default SEO |
| `customer` | commerce | Contact record matched on phone. Not a login. |
| `order` | commerce | Snapshotted line items, totals, delivery address with Dhaka zones, payment details, status workflow |
| `serviceRequest` | commerce | Quote requests from the services page |
| `productInterest` | commerce | Notify-me, wishlist and enquiry signals per product |

## Scripts

```bash
npm run dev            # both dev servers
npm run dev:studio     # Studio only
npm run dev:web        # storefront only
npm run typegen        # regenerate web/sanity.types.ts from the content workspace
npm run build:web      # production build of the storefront (stop next dev first)
```
