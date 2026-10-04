'use server'

import {redirect} from 'next/navigation'

import {useCases} from '@/composition/container'
import {isDomainError, OrderValidationError, WriteAccessUnavailableError} from '@/core/domain/errors'

import {checkoutFormSchema, fieldErrorsFrom} from '../forms/schemas'
import {failure, formValues, type ActionState} from './action-state'

export async function placeOrderAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = checkoutFormSchema.safeParse(values)
  if (!parsed.success) {
    return failure('Check the highlighted fields.', values, fieldErrorsFrom(parsed.error))
  }
  if (parsed.data.website) {
    return failure('Something went wrong. Please try again.', values)
  }

  const input = parsed.data
  let orderNumber: string

  try {
    const result = await useCases.placeOrder({
      items: [
        {
          productSlug: input.productSlug,
          variantId: input.variantId,
          quantity: input.quantity,
          customisation:
            input.printName || input.printNumber
              ? {name: input.printName, number: input.printNumber}
              : null,
        },
      ],
      customer: {name: input.name, phone: input.phone, email: input.email},
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
      paymentMethod: input.paymentMethod,
      paymentSenderNumber: input.senderNumber,
      paymentReference: input.reference,
      customerNote: input.note,
    })
    orderNumber = result.orderNumber
  } catch (error) {
    if (error instanceof OrderValidationError) {
      const fieldErrors: Record<string, string> = {}
      for (const problem of error.problems) {
        // Line-level problems map onto the single product this form sells.
        const field = problem.field.startsWith('items') ? 'variantId' : problem.field
        if (!(field in fieldErrors)) fieldErrors[field] = problem.message
      }
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
