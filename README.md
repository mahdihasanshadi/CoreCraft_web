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
| `SANITY_API_WRITE_TOKEN` | Checkout, enquiries, notify-me and customer accounts. Editor role. Without it the forms explain that ordering is not switched on. |
| `AUTH_SECRET` | Signs customer session cookies. Any random string of 32+ characters. Without it, sign-in is hidden and guest checkout still works. |

Create the two tokens at https://www.sanity.io/manage/project/3krwldhr/api.
Generate the secret with
`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
Restart the dev server after changing them. Do not run `npm run build:web` while
`next dev` is running; they share `.next` and the dev cache goes stale.

## Studio

Two workspaces, one Studio:

- **Content** (`/content`): Site settings pinned at the top, then products
  filtered by live, not yet live, sold out, featured, archived and by garment
  type, then categories, collections, brands and services. Every product has
  an **Insights** tab that reads interest signals, orders, units sold, revenue
  and size demand from the commerce dataset. Presentation Tool previews the
  storefront with click-to-edit.
- **Commerce** (`/commerce`): orders grouped by what needs doing with live
  counts, cash still to collect, service requests by stage, product interest
  grouped live per product. **Customers** appear only for administrators; the
  allowed roles are one constant in `studio/structure/commerce.ts`. Editors
  are the order managers; no extra role is needed.
- **Vision**, the GROQ console, is shown to administrators only.

Built-in roles are Administrator, Editor and Viewer. Custom roles need a
Growth plan.

After changing a schema:

```bash
cd studio && npx sanity schemas deploy && npm run typegen
```

### Running the shop from the Studio

The Commerce workspace opens on **Overview**: today's and this month's
orders and revenue, orders needing attention, cash still out with couriers,
new enquiries, open interest signals, the latest orders and products running
low. Every order document has two actions in its menu:

- **Cash collected**: records the amount and time as paid and marks the
  order delivered. This is how cash-on-delivery orders stop showing "Unpaid".
- **Next step**: Confirm order, Start preparing, Hand to courier, Mark
  delivered, always offering the following stage.

Editors cannot delete orders, only cancel them; administrators can delete.
Products have a **New t-shirt / drop shoulder / football jersey / cricket
jersey** template so the right fields show from the start, and an
**Insights** tab with demand and sales for that product.

Photos on products and category tiles are a mix of generated placeholders and
free Pexels photos (asset credit lines say which). Replace them with your own
shoots in the same fields.

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

Cash on delivery only, by the owner's decision. The gateway adapter returns
instructions to have cash ready, the order is saved as unpaid, and the team
marks it paid in the Studio once the courier settles. Settings can list other
methods, but each needs its own adapter implementing
`core/ports/payment-gateway.ts` before checkout will accept it.

### Cart

The bag is a cookie (`cc_cart`) holding slugs, variant IDs, quantities and
print requests, never prices. Quantity and removal are plain forms posting to
server actions, so the bag works without JavaScript. The header badge reads
the cookie on the client so catalogue pages stay static. `quoteCart` prices
the bag against the live catalogue; the cart page and checkout both use it,
so what the shopper sees is what the order records.

### Customer accounts

Phone and password. The password hash (Node scrypt, salted, parameters stored
with the hash) lives on the customer document in the private `commerce`
dataset under an `auth` object the Studio hides from editors. Sessions are
HMAC-signed stateless tokens in an httpOnly cookie; rotating `AUTH_SECRET`
signs everyone out. A guest who registers with the phone they ordered with
takes over that customer record and its order history. Login failures do not
reveal whether a phone exists, and a dummy hash check keeps timing even.

### Orders in the Studio

An order placed on the storefront is written as a published document in the
`commerce` dataset and appears under **Orders › Needs attention** in the
Commerce workspace immediately; the folder titles carry live counts. Editors
move it through Confirmed, Being prepared, With the courier and Delivered,
record courier and tracking, and mark cash collected. Every list shows the
payment and fulfilment badges.

## Content model

| Type | Dataset | Purpose |
| --- | --- | --- |
| `product` | production | Garment with type, fabric, GSM, fit, care, size chart, jersey fields, price, variants |
| `productVariant` | production | Size and colour with a hex swatch, own SKU, price override and stock |
| `category`, `brand`, `collection`, `service` | production | Taxonomy, label, curated shelf, made-to-order work |
| `siteSettings` | production | Singleton: brand copy, contact, delivery charges, payment methods, print fee, default SEO |
| `customer` | commerce | Contact record matched on phone; also the account when `auth` is set |
| `order` | commerce | Snapshotted line items, totals, delivery address with Dhaka zones, payment details, status workflow |
| `serviceRequest` | commerce | Quote requests from the services page |
| `productInterest` | commerce | Notify-me, wishlist and enquiry signals per product |

## Tests

```bash
cd web && npm test
```

Vitest covers the domain rules and the place-order use case against
in-memory fakes, so the pricing, stock, delivery and printing rules are
checked without a network. CI runs the same suite on every push.

## Scripts

```bash
npm run dev            # both dev servers
npm run dev:studio     # Studio only
npm run dev:web        # storefront only
npm run typegen        # regenerate web/sanity.types.ts from the content workspace
npm run build:web      # production build of the storefront (stop next dev first)
```
