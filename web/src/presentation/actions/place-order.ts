'use server'

import {redirect} from 'next/navigation'

import {useCases} from '@/composition/container'
import {isDomainError, OrderValidationError, WriteAccessUnavailableError} from '@/core/domain/errors'

import {checkoutFormSchema, fieldErrorsFrom} from '../forms/schemas'
import {failure, formValues, type ActionState} from './action-state'

/**
 * Places the whole bag as one order. Items come from the cart cookie, never
 * from the form, and the use case re-prices everything before saving.
 */
export async function placeOrderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = checkoutFormSchema.safeParse(values)
  if (!parsed.success) {
    return failure('Check the highlighted fields.', values, fieldErrorsFrom(parsed.error))
  }
  if (parsed.data.website) return failure('Something went wrong. Please try again.', values)

  const input = parsed.data
  let orderNumber: string

  try {
    const [cartView, account] = await Promise.all([useCases.viewCart(), useCases.getCurrentCustomer()])
    if (cartView.cart.items.length === 0) {
      return failure('Your bag is empty.', values, {items: 'Add something to your bag first.'})
    }

    const result = await useCases.placeOrder({
      items: cartView.cart.items,
      customer: {name: input.name, phone: input.phone, email: input.email},
      customerId: account?.id ?? null,
      shippingAddress: {
        fullName: input.name,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2,
        area: input.area,
        city: input.city,
        postalCode: input.postalCode,
        zone: input.zone,
        country: 'Bangladesh',
      },
      paymentMethod: 'cod',
      customerNote: input.note,
    })
    orderNumber = result.orderNumber
    await useCases.clearCart()
  } catch (error) {
    if (error instanceof OrderValidationError) {
      const itemMessages = error.problems
        .filter((problem) => problem.field.startsWith('items'))
        .map((problem) => problem.message)
      const fieldErrors: Record<string, string> = {}
      for (const problem of error.problems) {
        if (!problem.field.startsWith('items') && !(problem.field in fieldErrors)) {
          fieldErrors[problem.field] = problem.message
        }
      }
      if (itemMessages.length > 0) fieldErrors.items = itemMessages.join(' ')
      return failure('We could not place that order.', values, fieldErrors)
    }
    if (error instanceof WriteAccessUnavailableError) {
      return failure('Ordering is not switched on yet. Please order over WhatsApp for now.', values)
    }
    if (isDomainError(error)) return failure(error.message, values)
    console.error('placeOrderAction failed', error)
    return failure('Something went wrong. Please try again.', values)
  }

  redirect(`/checkout/thanks/${encodeURIComponent(orderNumber)}`)
}
