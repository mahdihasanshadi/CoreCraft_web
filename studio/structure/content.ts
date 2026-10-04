import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'
import {BasketIcon} from '@sanity/icons/Basket'
import {CogIcon} from '@sanity/icons/Cog'
import {PackageIcon} from '@sanity/icons/Package'
import {StarIcon} from '@sanity/icons/Star'
import {TagIcon} from '@sanity/icons/Tag'
import {WrenchIcon} from '@sanity/icons/Wrench'

import {productTypes} from '../schemaTypes/documents/product'
import {productTemplateId} from '../templates'
import {filteredList, singletonItem} from './helpers'
import {ProductInsights} from './views/product-insights'

const OUT_OF_STOCK = `_type == "product" && status == "active" && (
  (count(variants) == 0 && stock <= 0) ||
  (count(variants) > 0 && count(variants[stock > 0]) == 0)
)`

/**
 * The editorial desk for the public catalogue.
 *
 * Products get their own folder with the views a merchandiser reaches for
 * daily: what is live, what is still a draft, what has sold out, and each
 * garment type on its own with a matching "New" button.
 */
export const contentStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      singletonItem(S, {type: 'siteSettings', title: 'Site settings', icon: CogIcon}),

      S.divider(),

      S.listItem()
        .id('products')
        .title('Products')
        .icon(PackageIcon)
        .child(
          S.list()
            .title('Products')
            .items([
              S.documentTypeListItem('product').id('all-products').title('All products'),
              filteredList(S, {
                id: 'active-products',
                title: 'Live in store',
                schemaType: 'product',
                filter: '_type == "product" && status == "active"',
              }),
              filteredList(S, {
                id: 'draft-products',
                title: 'Not yet live',
                schemaType: 'product',
                filter: '_type == "product" && status == "draft"',
              }),
              filteredList(S, {
                id: 'out-of-stock-products',
                title: 'Sold out',
                schemaType: 'product',
                filter: OUT_OF_STOCK,
              }),
              filteredList(S, {
                id: 'featured-products',
                title: 'Featured on home',
                schemaType: 'product',
                filter: '_type == "product" && featured == true',
              }),
              filteredList(S, {
                id: 'archived-products',
                title: 'Archived',
                schemaType: 'product',
                filter: '_type == "product" && status == "archived"',
              }),

              S.divider(),

              ...productTypes.map((entry) =>
                filteredList(S, {
                  id: `products-${entry.value}`,
                  title: entry.title,
                  schemaType: 'product',
                  filter: '_type == "product" && productType == $type',
                  params: {type: entry.value},
                  templates: entry.value === 'other' ? undefined : [productTemplateId(entry.value)],
                }),
              ),
            ]),
        ),

      S.documentTypeListItem('category').title('Categories').icon(TagIcon),
      S.documentTypeListItem('collection').title('Collections').icon(BasketIcon),
      S.documentTypeListItem('brand').title('Brands').icon(StarIcon),

      S.divider(),

      S.documentTypeListItem('service').title('Services').icon(WrenchIcon),
    ])

/** Products get an Insights tab fed from the private commerce dataset. */
export const contentDefaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'product') {
    return S.document().views([
      S.view.form(),
      S.view.component(ProductInsights).id('insights').title('Insights'),
    ])
  }
  return S.document().views([S.view.form()])
}
