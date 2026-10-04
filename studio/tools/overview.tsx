import {useEffect, useState} from 'react'
import {Badge, Box, Card, Container, Flex, Grid, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {DashboardIcon} from '@sanity/icons/Dashboard'

import {API_VERSION} from '../structure/helpers'

const PRODUCTION_DATASET = 'production'

interface Overview {
  today: {orders: number; revenue: number}
  week: {orders: number; revenue: number}
  month: {orders: number; revenue: number}
  needsAttention: number
  cashToCollect: {count: number; amount: number}
  newRequests: number
  openInterest: number
  recent: {
    _id: string
    orderNumber: string | null
    status: string | null
    paid: string | null
    total: number | null
    placedAt: string | null
    customer: string | null
  }[]
}

interface LowStock {
  _id: string
  name: string | null
  lines: {size: string | null; colour: string | null; stock: number | null}[]
}

const COUNTED = `status in ["confirmed", "processing", "shipped", "delivered"]`

const OVERVIEW_QUERY = `{
  "today": {
    "orders": count(*[_type == "order" && placedAt >= $today]),
    "revenue": math::sum(*[_type == "order" && placedAt >= $today && ${COUNTED}].total)
  },
  "week": {
    "orders": count(*[_type == "order" && placedAt >= $week]),
    "revenue": math::sum(*[_type == "order" && placedAt >= $week && ${COUNTED}].total)
  },
  "month": {
    "orders": count(*[_type == "order" && placedAt >= $month]),
    "revenue": math::sum(*[_type == "order" && placedAt >= $month && ${COUNTED}].total)
  },
  "needsAttention": count(*[_type == "order" && status in ["pending", "confirmed"]]),
  "cashToCollect": {
    "count": count(*[_type == "order" && payment.status in ["unpaid", "pending"] && status in ["shipped", "delivered"]]),
    "amount": math::sum(*[_type == "order" && payment.status in ["unpaid", "pending"] && status in ["shipped", "delivered"]].total)
  },
  "newRequests": count(*[_type == "serviceRequest" && status == "new"]),
  "openInterest": count(*[_type == "productInterest" && handled == "open"]),
  "recent": *[_type == "order"] | order(placedAt desc)[0...8]{
    _id, orderNumber, status, "paid": payment.status, total, placedAt, "customer": customer->name
  }
}`

const LOW_STOCK_QUERY = `*[_type == "product" && status == "active" && count(variants[stock <= 2]) > 0][0...8]{
  _id, name, "lines": variants[stock <= 2]{size, colour, stock}
}`

function startOf(daysAgo: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function taka(amount: number | null | undefined): string {
  return `৳${Math.round(amount ?? 0).toLocaleString()}`
}

function Stat({label, value, hint, tone}: {label: string; value: string; hint?: string; tone?: 'positive' | 'caution' | 'critical'}) {
  return (
    <Card padding={4} radius={3} shadow={1} tone={tone ?? 'default'}>
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
 * The first thing staff see in the Commerce workspace: what came in, what
 * needs doing, what cash is still out with couriers, and what is about to
 * sell out in the catalogue.
 */
export function OverviewTool() {
  const commerce = useClient({apiVersion: API_VERSION})
  const production = commerce.withConfig({dataset: PRODUCTION_DATASET})
  const [state, setState] = useState<{loading: boolean; error?: string; data?: Overview; lowStock?: LowStock[]}>({
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    const params = {today: startOf(0), week: startOf(6), month: startOf(29)}
    Promise.all([commerce.fetch<Overview>(OVERVIEW_QUERY, params), production.fetch<LowStock[]>(LOW_STOCK_QUERY)])
      .then(([data, lowStock]) => {
        if (!cancelled) setState({loading: false, data, lowStock})
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({loading: false, error: error instanceof Error ? error.message : String(error)})
      })
    return () => {
      cancelled = true
    }
  }, [commerce, production])

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
          <Text>Could not load the overview. {state.error}</Text>
        </Card>
      </Box>
    )
  }

  const {data} = state
  return (
    <Container width={4} padding={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Heading size={3}>Today at CoreCraft</Heading>
          <Text size={1} muted>
            Revenue counts confirmed orders onward. Cash to collect is what couriers still hold.
          </Text>
        </Stack>

        <Grid gridTemplateColumns={[1, 2, 4]} gap={3}>
          <Stat label="Orders today" value={String(data.today.orders)} hint={`${taka(data.today.revenue)} revenue`} />
          <Stat label="Last 7 days" value={String(data.week.orders)} hint={`${taka(data.week.revenue)} revenue`} />
          <Stat label="Last 30 days" value={String(data.month.orders)} hint={`${taka(data.month.revenue)} revenue`} />
          <Stat
            label="Needs attention"
            value={String(data.needsAttention)}
            hint="Pending or confirmed, not yet prepared"
            tone={data.needsAttention > 0 ? 'caution' : 'positive'}
          />
        </Grid>

        <Grid gridTemplateColumns={[1, 3]} gap={3}>
          <Stat
            label="Cash to collect"
            value={taka(data.cashToCollect.amount)}
            hint={`${data.cashToCollect.count} shipped or delivered orders not yet marked paid`}
            tone={data.cashToCollect.count > 0 ? 'caution' : 'positive'}
          />
          <Stat label="New service requests" value={String(data.newRequests)} hint="Waiting for a first reply" />
          <Stat label="Open interest signals" value={String(data.openInterest)} hint="Notify-me and wishlist requests" />
        </Grid>

        <Grid gridTemplateColumns={[1, 1, 2]} gap={4}>
          <Card padding={4} radius={3} shadow={1}>
            <Stack gap={3}>
              <Text weight="semibold">Latest orders</Text>
              {data.recent.length === 0 ? (
                <Text size={1} muted>
                  No orders yet.
                </Text>
              ) : (
                <Stack gap={3}>
                  {data.recent.map((order) => (
                    <Flex key={order._id} justify="space-between" align="center" gap={3}>
                      <Stack gap={2}>
                        <IntentLink intent="edit" params={{id: order._id, type: 'order'}} style={{textDecoration: 'none'}}>
                          <Text size={1} weight="medium">
                            {order.orderNumber ?? order._id}
                          </Text>
                        </IntentLink>
                        <Text size={0} muted>
                          {order.customer ?? 'Customer'} · {order.placedAt ? new Date(order.placedAt).toLocaleString() : ''}
                        </Text>
                      </Stack>
                      <Flex gap={2} align="center">
                        <Badge tone={order.paid === 'paid' ? 'positive' : 'caution'} fontSize={0}>
                          {order.paid === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                        <Badge tone={order.status === 'delivered' ? 'positive' : 'default'} fontSize={0}>
                          {order.status}
                        </Badge>
                        <Text size={1}>{taka(order.total)}</Text>
                      </Flex>
                    </Flex>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>

          <Card padding={4} radius={3} shadow={1}>
            <Stack gap={3}>
              <Text weight="semibold">Running low in the shop</Text>
              {!state.lowStock || state.lowStock.length === 0 ? (
                <Text size={1} muted>
                  Every size has more than two units.
                </Text>
              ) : (
                <Stack gap={3}>
                  {state.lowStock.map((product) => (
                    <Stack key={product._id} gap={2}>
                      <IntentLink intent="edit" params={{id: product._id, type: 'product'}} style={{textDecoration: 'none'}}>
                        <Text size={1} weight="medium">
                          {product.name ?? product._id}
                        </Text>
                      </IntentLink>
                      <Flex gap={2} wrap="wrap">
                        {product.lines.map((line, index) => (
                          <Badge key={index} tone={(line.stock ?? 0) === 0 ? 'critical' : 'caution'} fontSize={0}>
                            {[line.size, line.colour].filter(Boolean).join(' / ')} · {line.stock ?? 0} left
                          </Badge>
                        ))}
                      </Flex>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        </Grid>
      </Stack>
    </Container>
  )
}

export const overviewTool = {
  name: 'overview',
  title: 'Overview',
  icon: DashboardIcon,
  component: OverviewTool,
}
