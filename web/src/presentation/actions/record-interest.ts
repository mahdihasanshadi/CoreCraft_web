'use server'

import {useCases} from '@/composition/container'
import {isDomainError, WriteAccessUnavailableError} from '@/core/domain/errors'

import {fieldErrorsFrom, interestFormSchema} from '../forms/schemas'
import {failure, formValues, success, type ActionState} from './action-state'

export async function recordInterestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = interestFormSchema.safeParse(values)
  if (!parsed.success) {
    return failure('Check the highlighted field.', values, fieldErrorsFrom(parsed.error))
  }

  try {
    await useCases.recordProductInterest({
      kind: parsed.data.kind,
      productSlug: parsed.data.productSlug,
      variantId: parsed.data.variantId,
      phone: parsed.data.phone,
      email: parsed.data.email,
      note: parsed.data.note,
    })
  } catch (error) {
    if (error instanceof WriteAccessUnavailableError) {
      return failure('We cannot save requests right now. Please message us on WhatsApp instead.', values)
    }
    if (isDomainError(error)) return failure(error.message, values)
    console.error('recordInterestAction failed', error)
    return failure('Something went wrong. Please try again.', values)
  }

  return success(
    parsed.data.kind === 'notifyMe'
      ? 'Noted. We will let you know the moment it is back.'
      : 'Thanks, we have noted your interest.',
  )
}
