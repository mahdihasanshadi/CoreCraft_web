import {OrderNotFoundError} from '@/core/domain/errors'
import type {PlacedOrder} from '@/core/domain/order'
import type {Service} from '@/core/domain/service'
import type {OrderRepository, ServiceRepository} from '@/core/ports/commerce-repositories'

export type ListServices = () => Promise<readonly Service[]>

export function makeListServices({services}: {services: ServiceRepository}): ListServices {
  return function listServices() {
    return services.listOffered()
  }
}

export type GetOrderByNumber = (orderNumber: string) => Promise<PlacedOrder>

/**
 * Order numbers are unguessable enough for a confirmation page, which is the
 * only place this is used. A customer account area would need real auth.
 */
export function makeGetOrderByNumber({orders}: {orders: OrderRepository}): GetOrderByNumber {
  return async function getOrderByNumber(orderNumber) {
    const trimmed = orderNumber.trim().toUpperCase()
    const order = trimmed ? await orders.findByNumber(trimmed) : null
    if (!order) throw new OrderNotFoundError(orderNumber)
    return order
  }
}
