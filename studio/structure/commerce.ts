import {map} from 'rxjs'
import type {StructureResolver} from 'sanity/structure'
import {BillIcon} from '@sanity/icons/Bill'
import {ClipboardIcon} from '@sanity/icons/Clipboard'
import {HeartIcon} from '@sanity/icons/Heart'
import {UsersIcon} from '@sanity/icons/Users'

import {API_VERSION, filteredList, hasAnyRole} from './helpers'

/**
 * Who may see and manage customer records. Administrators only by default.
 * Add "editor" here to open it to every editor, or create a custom role on a
 * Growth plan and name it instead.
 */
export const CUSTOMER_MANAGER_ROLES = ['administrator'] as const

const newestFirst = (field: string) => [{field, direction: 'desc' as const}]

/**
 * The operations desk. Orders by what needs doing, enquiries by stage, and
 * product interest grouped live by product so the team can see demand.
 */
export const commerceStructure: StructureResolver = (S, context) => {
  const canManageCustomers = hasAnyRole(context, CUSTOMER_MANAGER_ROLES)

  const orders = S.listItem()
    .id('orders')
    .title('Orders')
    .icon(BillIcon)
    .child(
      S.list()
        .title('Orders')
        .items([
          filteredList(S, {
            id: 'orders-attention',
            title: 'Needs attention',
            schemaType: 'order',
            filter: '_type == "order" && status in ["pending", "confirmed"]',
            defaultOrdering: newestFirst('placedAt'),
          }),
          filteredList(S, {
            id: 'orders-processing',
            title: 'Being prepared',
            schemaType: 'order',
            filter: '_type == "order" && status == "processing"',
            defaultOrdering: newestFirst('placedAt'),
          }),
          filteredList(S, {
            id: 'orders-shipped',
            title: 'With the courier',
            schemaType: 'order',
            filter: '_type == "order" && status == "shipped"',
            defaultOrdering: newestFirst('placedAt'),
          }),
          filteredList(S, {
            id: 'orders-delivered',
            title: 'Delivered',
            schemaType: 'order',
            filter: '_type == "order" && status == "delivered"',
            defaultOrdering: newestFirst('placedAt'),
          }),
          filteredList(S, {
            id: 'orders-closed',
            title: 'Cancelled and returned',
            schemaType: 'order',
            filter: '_type == "order" && status in ["cancelled", "returned"]',
            defaultOrdering: newestFirst('placedAt'),
          }),
          S.divider(),
          filteredList(S, {
            id: 'orders-unpaid',
            title: 'Awaiting payment',
            schemaType: 'order',
            filter:
              '_type == "order" && payment.status in ["unpaid", "pending"] && !(status in ["cancelled", "returned"])',
            defaultOrdering: newestFirst('placedAt'),
          }),
          S.divider(),
          S.documentTypeListItem('order').id('orders-all').title('All orders'),
        ]),
    )

  const serviceRequests = S.listItem()
    .id('service-requests')
    .title('Service requests')
    .icon(ClipboardIcon)
    .child(
      S.list()
        .title('Service requests')
        .items([
          filteredList(S, {
            id: 'requests-new',
            title: 'New',
            schemaType: 'serviceRequest',
            filter: '_type == "serviceRequest" && status == "new"',
            defaultOrdering: newestFirst('submittedAt'),
          }),
          filteredList(S, {
            id: 'requests-in-progress',
            title: 'In conversation',
            schemaType: 'serviceRequest',
            filter: '_type == "serviceRequest" && status in ["contacted", "quoted"]',
            defaultOrdering: newestFirst('submittedAt'),
          }),
          filteredList(S, {
            id: 'requests-closed',
            title: 'Won and lost',
            schemaType: 'serviceRequest',
            filter: '_type == "serviceRequest" && status in ["won", "lost"]',
            defaultOrdering: newestFirst('submittedAt'),
          }),
          S.divider(),
          S.documentTypeListItem('serviceRequest').id('requests-all').title('All requests'),
        ]),
    )

  const interest = S.listItem()
    .id('product-interest')
    .title('Product interest')
    .icon(HeartIcon)
    .child(
      S.list()
        .title('Product interest')
        .items([
          filteredList(S, {
            id: 'interest-open',
            title: 'Open requests',
            schemaType: 'productInterest',
            filter: '_type == "productInterest" && handled == "open"',
            defaultOrdering: newestFirst('submittedAt'),
          }),
          S.documentTypeListItem('productInterest').id('interest-all').title('All signals'),
          S.divider(),
          S.listItem()
            .id('interest-by-product')
            .title('By product')
            .child(() =>
              context.documentStore
                .listenQuery(
                  `*[_type == "productInterest"]{productId, productName}`,
                  {},
                  {tag: 'interest-by-product'},
                )
                .pipe(
                  map((rows: {productId?: string; productName?: string}[]) => {
                    const counts = new Map<string, {name: string; count: number}>()
                    for (const row of rows) {
                      if (!row.productId) continue
                      const current = counts.get(row.productId)
                      counts.set(row.productId, {
                        name: row.productName ?? current?.name ?? 'Unknown product',
                        count: (current?.count ?? 0) + 1,
                      })
                    }
                    const sorted = [...counts.entries()].sort((a, b) => b[1].count - a[1].count)

                    return S.list()
                      .title('Interest by product')
                      .items(
                        sorted.map(([productId, {name, count}]) =>
                          S.listItem()
                            .id(`interest-${productId}`)
                            .title(`${name} (${count})`)
                            .child(
                              S.documentList()
                                .id(`interest-list-${productId}`)
                                .title(name)
                                .schemaType('productInterest')
                                .filter('_type == "productInterest" && productId == $productId')
                                .params({productId})
                                .apiVersion(API_VERSION)
                                .defaultOrdering(newestFirst('submittedAt')),
                            ),
                        ),
                      )
                  }),
                ),
            ),
        ]),
    )

  return S.list()
    .title('Commerce')
    .items([
      orders,
      serviceRequests,
      interest,
      ...(canManageCustomers
        ? [S.divider(), S.documentTypeListItem('customer').title('Customers').icon(UsersIcon)]
        : []),
    ])
}
