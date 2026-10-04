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
  "secondaryImage": images[1]{${IMAGE_PROJECTION}},
  "brand": brand->{name, "slug": slug.current},
  "variants": variants[]{stock, colour, colourHex, size}
`

const PURCHASABLE = /* groq */ `_type == "product" && status == "active" && defined(slug.current)`

/** Only products an editor has marked active and given a slug. */
export const PURCHASABLE_PRODUCTS_QUERY = defineQuery(`
  *[${PURCHASABLE}]{
    ${PRODUCT_SUMMARY_PROJECTION}
  }
`)

/**
 * Filtered listing. Optional params are matched with "null or equal" so one
 * query serves every combination. Sorting is applied by the caller for
 * "featured"; the plain field orders are separate queries below because GROQ
 * cannot take an order direction as a parameter.
 */
const FILTERED = /* groq */ `${PURCHASABLE}
  && ($type == null || productType == $type)
  && ($category == null || $category in categories[]->slug.current)`

export const FILTERED_PRODUCTS_BY_NAME_QUERY = defineQuery(`
  *[${FILTERED}] | order(name asc){${PRODUCT_SUMMARY_PROJECTION}}
`)
export const FILTERED_PRODUCTS_NEWEST_QUERY = defineQuery(`
  *[${FILTERED}] | order(_createdAt desc){${PRODUCT_SUMMARY_PROJECTION}}
`)
export const FILTERED_PRODUCTS_PRICE_ASC_QUERY = defineQuery(`
  *[${FILTERED}] | order(price asc){${PRODUCT_SUMMARY_PROJECTION}}
`)
export const FILTERED_PRODUCTS_PRICE_DESC_QUERY = defineQuery(`
  *[${FILTERED}] | order(price desc){${PRODUCT_SUMMARY_PROJECTION}}
`)

export const NEWEST_PRODUCTS_QUERY = defineQuery(`
  *[${PURCHASABLE}] | order(_createdAt desc)[0...8]{${PRODUCT_SUMMARY_PROJECTION}}
`)

/** Same type or a shared category, featured first, never the product itself. */
export const RELATED_PRODUCTS_QUERY = defineQuery(`
  *[${PURCHASABLE} && _id != $id
    && (productType == $type || count((categories[]->slug.current)[@ in $categories]) > 0)]
  | order(featured desc, _createdAt desc)[0...4]{${PRODUCT_SUMMARY_PROJECTION}}
`)

/** Prefix match over the fields shoppers actually type. */
export const SEARCH_PRODUCTS_QUERY = defineQuery(`
  *[${PURCHASABLE} && [name, excerpt, team, season, fabric, productType] match $term]
  | order(featured desc, name asc)[0...24]{${PRODUCT_SUMMARY_PROJECTION}}
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

export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category" && defined(slug.current)] | order(title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    "image": image{${IMAGE_PROJECTION}},
    "parentSlug": parent->slug.current,
    "productCount": count(*[${PURCHASABLE} && references(^._id)])
  }
`)

/** The singleton, by its fixed ID. */
export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0]{
    storeName,
    tagline,
    heroHeading,
    heroText,
    "heroImage": heroImage{${IMAGE_PROJECTION}},
    heroCta,
    usps,
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
    "products": products[@->status == "active" && defined(@->slug.current)]->{
      ${PRODUCT_SUMMARY_PROJECTION}
    }
  }
`)
