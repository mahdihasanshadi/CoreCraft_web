import {map} from 'rxjs'
import type {StructureBuilder, StructureResolver, StructureResolverContext} from 'sanity/structure'
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

interface OrderFolder {
  id: string
  title: string
  filter: string
  matches: (row: {status?: string; paid?: string}) => boolean
}

const ORDER_FOLDERS: OrderFolder[] = [
  {
    id: 'orders-attention',
    title: 'Needs attention',
    filter: '_type == "order" && status in ["pending", "confirmed"]',
    matches: (row) => row.status === 'pending' || row.status === 'confirmed',
  },
  {
    id: 'orders-processing',
    title: 'Being prepared',
    filter: '_type == "order" && status == "processing"',
    matches: (row) => row.status === 'processing',
  },
  {
    id: 'orders-shipped',
    title: 'With the courier',
    filter: '_type == "order" && status == "shipped"',
    matches: (row) => row.status === 'shipped',
  },
  {
    id: 'orders-delivered',
    title: 'Delivered',
    filter: '_type == "order" && status == "delivered"',
    matches: (row) => row.status === 'delivered',
  },
  {
    id: 'orders-closed',
    title: 'Cancelled and returned',
    filter: '_type == "order" && status in ["cancelled", "returned"]',
    matches: (row) => row.status === 'cancelled' || row.status === 'returned',
  },
]

const CASH_TO_COLLECT: OrderFolder = {
  id: 'orders-unpaid',
  title: 'Cash still to collect',
  filter: '_type == "order" && payment.status in ["unpaid", "pending"] && status in ["shipped", "delivered"]',
  matches: (row) =>
    (row.paid === 'unpaid' || row.paid === 'pending') && (row.status === 'shipped' || row.status === 'delivered'),
}

/**
 * Orders folder with live counts in every title. A new order from the
 * storefront lands as a published document and shows up under "Needs
 * attention" without a refresh, because the list is driven by a listener.
 */
function ordersFolder(S: StructureBuilder, context: StructureResolverContext) {
  return S.listItem()
    .id('orders')
    .title('Orders')
    .icon(BillIcon)
    .child(() =>
      context.documentStore
        .listenQuery(`*[_type == "order"]{status, "paid": payment.status}`, {}, {tag: 'order-counts'})
        .pipe(
          map((rows: {status?: string; paid?: string}[]) => {
            const count = (folder: OrderFolder) => rows.filter(folder.matches).length
            const withCount = (folder: OrderFolder) =>
              filteredList(S, {
                id: folder.id,
                title: `${folder.title} (${count(folder)})`,
                schemaType: 'order',
                filter: folder.filter,
                defaultOrdering: newestFirst('placedAt'),
              })

            return S.list()
              .title(`Orders (${rows.length})`)
              .items([
                ...ORDER_FOLDERS.map(withCount),
                S.divider(),
                withCount(CASH_TO_COLLECT),
                S.divider(),
                S.documentTypeListItem('order').id('orders-all').title(`All orders (${rows.length})`),
              ])
          }),
        ),
    )
}

/**
 * The operations desk. Orders by what needs doing, enquiries by stage, and
 * product interest grouped live by product so the team can see demand.
 */
export const commerceStructure: StructureResolver = (S, context) => {
  const canManageCustomers = hasAnyRole(context, CUSTOMER_MANAGER_ROLES)

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
      ordersFolder(S, context),
      serviceRequests,
      interest,
      ...(canManageCustomers
        ? [S.divider(), S.documentTypeListItem('customer').title('Customers').icon(UsersIcon)]
        : []),
    ])
}
