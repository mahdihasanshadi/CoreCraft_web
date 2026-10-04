import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

/**
 * Tells Presentation Tool where each document shows up on the storefront, so
 * editors get a "View on site" link and can jump between the form and the
 * live page.
 */
export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    product: defineLocations({
      select: {name: 'name', slug: 'slug.current'},
      resolve: (doc) => ({
        locations: [
          {title: doc?.name ?? 'Untitled product', href: `/products/${doc?.slug ?? ''}`},
          {title: 'Shop', href: '/'},
        ],
      }),
    }),
    collection: defineLocations({
      select: {title: 'title'},
      resolve: () => ({locations: [{title: 'Shop', href: '/'}]}),
    }),
    service: defineLocations({
      select: {title: 'title'},
      resolve: () => ({locations: [{title: 'Services', href: '/services'}]}),
    }),
    siteSettings: defineLocations({
      message: 'Site settings affect every page.',
      tone: 'caution',
      locations: [{title: 'Home', href: '/'}],
    }),
  },
}
