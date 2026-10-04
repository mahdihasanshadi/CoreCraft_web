import {defineQuery} from 'next-sanity'

/**
 * GROQ for the public catalogue lives only in this file.
 *
 * Every projection names its fields so the mappers receive a known shape, and
 * image assets are reduced to a bare `assetId` because that is all the domain
 * carries. TypeGen reads these literals to generate `sanity.types.ts`.
 */

const IMAGE_PROJECTION = /* groq */ `
  "assetId": asset._ref,
  alt,
  hotspot
`

const VARIANT_PROJECTION = /* groq */ `
  _key,
  size,
  colour,
  colourHex,
  sku,
  price,
  stock
`

const PRODUCT_SUMMARY_PROJECTION = /* groq */ `
  _id,
  name,
  "slug": slug.current,
  excerpt,
  productType,
  featured,
  price,
  compareAtPrice,
  stock,
  "primaryImage": images[0]{${IMAGE_PROJECTION}},
  "brand": brand->{name, "slug": slug.current},
  "variants": variants[]{stock, colour, colourHex}
`

const PURCHASABLE = /* groq */ `_type == "product" && status == "active" && defined(slug.current)`

/** Only products an editor has marked active and given a slug. */
export const PURCHASABLE_PRODUCTS_QUERY = defineQuery(`
  *[${PURCHASABLE}]{
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
    productType,
    featured,
    price,
    compareAtPrice,
    sku,
    stock,
    fabric,
    gsm,
    fit,
    audience,
    careInstructions,
    "sizeChart": sizeChart{${IMAGE_PROJECTION}},
    team,
    season,
    kitType,
    customisable,
    "images": images[]{${IMAGE_PROJECTION}},
    "brand": brand->{name, "slug": slug.current},
    "categories": categories[]->{_id, title, "slug": slug.current},
    "variants": variants[]{${VARIANT_PROJECTION}},
    "seo": seo{
      title,
      description,
      "shareImage": image{${IMAGE_PROJECTION}}
    }
  }
`)

export const PURCHASABLE_PRODUCT_SLUGS_QUERY = defineQuery(`
  *[${PURCHASABLE}].slug.current
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

/** The singleton, by its fixed ID. */
export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    storeName,
    tagline,
    heroHeading,
    heroText,
    "logo": logo{${IMAGE_PROJECTION}},
    announcement,
    contactEmail,
    contactPhone,
    whatsapp,
    social,
    currency,
    shipping,
    enabledPaymentMethods,
    paymentInstructions,
    jerseyCustomisationFee,
    "defaultSeo": defaultSeo{
      title,
      description,
      "shareImage": image{${IMAGE_PROJECTION}}
    }
  }
`)

export const ACTIVE_SERVICES_QUERY = defineQuery(`
  *[_type == "service" && status == "active" && defined(slug.current)] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    summary,
    description,
    "image": image{${IMAGE_PROJECTION}},
    startingPrice,
    minimumQuantity,
    turnaroundDays
  }
`)

/**
 * Collections with their products in editor order. Products that are no
 * longer purchasable are dropped at query time so a stale reference never
 * reaches the page.
 */
export const COLLECTIONS_QUERY = defineQuery(`
  *[_type == "collection" && defined(slug.current)] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    "heroImage": image{${IMAGE_PROJECTION}},
    "products": products[]->[${PURCHASABLE}]{
      ${PRODUCT_SUMMARY_PROJECTION}
    }
  }
`)
