'use server'

import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

import {useCases} from '@/composition/container'

import {addToBagSchema, cartLineSchema, fieldErrorsFrom} from '../forms/schemas'
import {failure, formValues, type ActionState} from './action-state'

function itemFrom(data: ReturnType<typeof addToBagSchema.parse>) {
  return {
    productSlug: data.productSlug,
    variantId: data.variantId,
    quantity: data.quantity,
    print: data.printName || data.printNumber ? {name: data.printName, number: data.printNumber} : null,
  }
}

export async function addToBagAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = addToBagSchema.safeParse(values)
  if (!parsed.success) return failure('Choose a size first.', values, fieldErrorsFrom(parsed.error))

  const {count} = await useCases.addCartItem(itemFrom(parsed.data))
  revalidatePath('/cart')
  return {status: 'success', message: 'Added to your bag.', fieldErrors: {}, values: {count: String(count)}}
}

/** Same as adding, then straight to checkout. */
export async function buyNowAction(formData: FormData): Promise<void> {
  const parsed = addToBagSchema.safeParse(formValues(formData))
  if (!parsed.success) return
  await useCases.addCartItem(itemFrom(parsed.data))
  revalidatePath('/cart')
  redirect('/checkout')
}

export async function updateCartLineAction(formData: FormData): Promise<void> {
  const parsed = cartLineSchema.safeParse(formValues(formData))
  if (!parsed.success) return
  await useCases.updateCartItem(parsed.data.key, parsed.data.quantity)
  revalidatePath('/cart')
}

export async function removeCartLineAction(formData: FormData): Promise<void> {
  const key = formData.get('key')
  if (typeof key !== 'string' || !key) return
  await useCases.removeCartItem(key)
  revalidatePath('/cart')
}
