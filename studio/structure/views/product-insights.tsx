import {useEffect, useState} from 'react'
import {Badge, Box, Card, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import type {UserViewComponent} from 'sanity/structure'

import {API_VERSION} from '../helpers'

const COMMERCE_DATASET = 'commerce'

interface Insights {
  interestTotal: number
  notifyMe: number
  wishlist: number
  enquiries: number
  openInterest: number
  orderCount: number
  unitsSold: number
  revenue: number
  sizeDemand: {size: string | null}[]
  recentOrders: {
    _id: string
    orderNumber: string | null
    status: string | null
    placedAt: string | null
    quantity: number | null
  }[]
}

const QUERY = `{
  "interestTotal": count(*[_type == "productInterest" && productId == $id]),
  "notifyMe": count(*[_type == "productInterest" && productId == $id && kind == "notifyMe"]),
  "wishlist": count(*[_type == "productInterest" && productId == $id && kind == "wishlist"]),
  "enquiries": count(*[_type == "productInterest" && productId == $id && kind == "enquiry"]),
  "openInterest": count(*[_type == "productInterest" && productId == $id && handled == "open"]),
  "orderCount": count(*[_type == "order" && $id in items[].productId]),
  "unitsSold": math::sum(*[_type == "order" && status in ["confirmed", "processing", "shipped", "delivered"]].items[productId == $id].quantity),
  "revenue": math::sum(*[_type == "order" && status in ["confirmed", "processing", "shipped", "delivered"]].items[productId == $id].lineTotal),
  "sizeDemand": *[_type == "productInterest" && productId == $id && defined(size)]{size},
  "recentOrders": *[_type == "order" && $id in items[].productId] | order(placedAt desc)[0...6]{
    _id, orderNumber, status, placedAt, "quantity": items[productId == $id][0].quantity
  }
}`

function Stat({label, value, hint}: {label: string; value: string | number; hint?: string}) {
  return (
    <Card padding={4} radius={3} shadow={1} tone="default">
      <Stack gap={3}>
        <Text size={1} muted>
          {label}
        </Text>
        <Heading size={3}>{value}</Heading>
        {hint && (
          <Text size={1} muted>
            {hint}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

/**
 * A document view that answers "how is this product doing?" from the private
 * commerce dataset, where interest signals and orders live.
 */
export const ProductInsights: UserViewComponent = ({document}) => {
  const displayed = document.displayed as {_id?: string; name?: string}
  const productId = displayed._id?.replace(/^drafts\./, '')
  const client = useClient({apiVersion: API_VERSION}).withConfig({dataset: COMMERCE_DATASET})
  const [state, setState] = useState<{loading: boolean; error?: string; data?: Insights}>({
    loading: true,
  })

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    setState({loading: true})
    client
      .fetch<Insights>(QUERY, {id: productId})
      .then((data) => {
        if (!cancelled) setState({loading: false, data})
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({loading: false, error: error instanceof Error ? error.message : String(error)})
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, productId])

  if (!productId) {
    return (
      <Box padding={4}>
        <Text muted>Save the product first to see insights.</Text>
      </Box>
    )
  }

  if (state.loading) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  if (state.error || !state.data) {
    return (
      <Box padding={4}>
        <Card padding={4} radius={3} tone="critical">
          <Text>Could not load insights. {state.error}</Text>
        </Card>
      </Box>
    )
  }

  const {data} = state
  const sizeCounts = new Map<string, number>()
  for (const row of data.sizeDemand) {
    if (row.size) sizeCounts.set(row.size, (sizeCounts.get(row.size) ?? 0) + 1)
  }
  const sizes = [...sizeCounts.entries()].sort((a, b) => b[1] - a[1])

  return (
    <Box padding={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Heading size={2}>Demand and sales</Heading>
          <Text size={1} muted>
            Live from the commerce dataset. Interest comes from “notify me”, wishlist and enquiry
            actions on the storefront.
          </Text>
        </Stack>

        <Grid gridTemplateColumns={[1, 2, 4]} gap={3}>
          <Stat
            label="Interest signals"
            value={data.interestTotal}
            hint={`${data.openInterest} still open`}
          />
          <Stat label="Waiting for restock" value={data.notifyMe} hint="Notify-me requests" />
          <Stat label="Orders" value={data.orderCount} hint={`${data.unitsSold} units sold`} />
          <Stat
            label="Revenue"
            value={`৳${Math.round(data.revenue).toLocaleString()}`}
            hint="Confirmed and later"
          />
        </Grid>

        <Grid gridTemplateColumns={[1, 1, 2]} gap={4}>
          <Card padding={4} radius={3} shadow={1}>
            <Stack gap={3}>
              <Text weight="semibold">Sizes people asked for</Text>
              {sizes.length === 0 ? (
                <Text size={1} muted>
                  No size data yet.
                </Text>
              ) : (
                <Flex gap={2} wrap="wrap">
                  {sizes.map(([size, count]) => (
                    <Badge key={size} tone="primary" fontSize={1} padding={2}>
                      {size} · {count}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Stack>
          </Card>

          <Card padding={4} radius={3} shadow={1}>
            <Stack gap={3}>
              <Text weight="semibold">Recent orders</Text>
              {data.recentOrders.length === 0 ? (
                <Text size={1} muted>
                  Not ordered yet.
                </Text>
              ) : (
                <Stack gap={2}>
                  {data.recentOrders.map((row) => (
                    <Flex key={row._id} justify="space-between" align="center">
                      <Text size={1}>
                        {row.orderNumber ?? row._id} · {row.quantity ?? 1} pc
                      </Text>
                      <Flex gap={2} align="center">
                        <Badge tone={row.status === 'delivered' ? 'positive' : 'default'} fontSize={0}>
                          {row.status}
                        </Badge>
                        <Text size={0} muted>
                          {row.placedAt ? new Date(row.placedAt).toLocaleDateString() : ''}
                        </Text>
                      </Flex>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid>

        <Text size={1} muted>
          Wishlist saves: {data.wishlist}. Enquiries: {data.enquiries}.
        </Text>
      </Stack>
    </Box>
  )
}
