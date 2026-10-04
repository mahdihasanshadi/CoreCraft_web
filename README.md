# CoreCraft

E-commerce project with Sanity as the content backend and Next.js as the storefront.

| Folder | What it is | Dev URL |
| --- | --- | --- |
| `studio/` | Sanity Studio, standalone | http://localhost:3333 |
| `web/` | Next.js App Router storefront | http://localhost:3000 |

The Studio is deliberately kept standalone rather than embedded in the Next.js
app. It builds on Vite, receives auto-updates without a redeploy, and supports
TypeGen watch mode.

## Sanity project

| Setting | Value |
| --- | --- |
| Project ID | `3krwldhr` |
| Dataset | `production` |

## Getting started

Install dependencies for both apps:

```bash
npm run install:all
```

Create `web/.env.local` from the example and fill in a read token:

```bash
cp web/.env.example web/.env.local
```

Run both dev servers:

```bash
npm run dev
```

Or run them separately in two terminals with `npm run dev:studio` and
`npm run dev:web`.

## Content model

Document types live in `studio/schemaTypes/documents/` and reusable objects in
`studio/schemaTypes/objects/`.

| Type | Purpose |
| --- | --- |
| `product` | Sellable item, with pricing, stock, variants and rich description |
| `category` | Nestable taxonomy, each category may have a parent |
| `brand` | Manufacturer or label a product belongs to |
| `collection` | Hand-ordered, curated group of products |
| `productVariant` | Object embedded in a product, for size and colour options |
| `seo` | Object with meta title, description and social share image |

After changing a schema, deploy it so hosted tooling sees the change:

```bash
npm run build:studio
cd studio && npx sanity schemas deploy
```

## Types

TypeGen reads the queries in `web/` and writes types to `web/sanity.types.ts`:

```bash
npm run typegen
```

Run it after any schema or query change.
