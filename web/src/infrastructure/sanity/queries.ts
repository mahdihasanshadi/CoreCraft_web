import {defineQuery} from 'next-sanity'

/**
 * GROQ lives only in this file.
 *
 * Every projection names its fields so the mapper receives a known shape, and
 * image assets are reduced to a bare `assetId` because that is all the domain
 * carries. TypeGen reads these literals to generate `sanity.types.ts`.
 */

const IMAGE_PROJECTION = /* groq */ `
  "assetId": asset._ref,
  alt,
  hotspot
`

const PRODUCT_SUMMARY_PROJECTION = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  excerpt,
  price,
  compareAtPrice,
  stock,
  "primaryImage": images[0]{${IMAGE_PROJECTION}},
  "brand": brand->{name, "slug": slug.current},
  "variants": variants[]{stock}
`

/** Only products an editor has marked active and given a slug. */
export const PURCHASABLE_PRODUCTS_QUERY = defineQuery(`
  *[_type == "product" && status == "active" && defined(slug.current)]{
    ${PRODUCT_SUMMARY_PROJECTION}
  }
`)

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    excerpt,
    description,
    status,
    price,
    compareAtPrice,
    sku,
    stock,
    "images": images[]{${IMAGE_PROJECTION}},
    "brand": brand->{name, "slug": slug.current},
    "categories": categories[]->{_id, title, "slug": slug.current},
    "variants": variants[]{
      _key,
      title,
      sku,
      price,
      stock,
      "options": options[]{name, value}
    },
    "seo": seo{
      title,
      description,
      "shareImage": image{${IMAGE_PROJECTION}}
    }
  }
`)

export const PURCHASABLE_PRODUCT_SLUGS_QUERY = defineQuery(`
  *[_type == "product" && status == "active" && defined(slug.current)].slug.current
`)

export const PRODUCT_SEO_BY_SLUG_QUERY = defineQuery(`
  *[_type == "product" && slug.current == $slug][0]{
    name,
    excerpt,
    "seo": seo{
      title,
      description,
      "shareImage": image{${IMAGE_PROJECTION}}
    }
  }
`)
