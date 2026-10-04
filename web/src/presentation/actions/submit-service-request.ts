'use server'

import {useCases} from '@/composition/container'
import {isDomainError, WriteAccessUnavailableError} from '@/core/domain/errors'

import {fieldErrorsFrom, serviceRequestFormSchema} from '../forms/schemas'
import {failure, formValues, success, type ActionState} from './action-state'

export async function submitServiceRequestAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = serviceRequestFormSchema.safeParse(values)
  if (!parsed.success) {
    return failure('Check the highlighted fields.', values, fieldErrorsFrom(parsed.error))
  }
  // Honeypot filled: pretend it worked, store nothing.
  if (parsed.data.website) return success('Thanks. We will be in touch shortly.')

  try {
    await useCases.submitServiceRequest({
      serviceSlug: parsed.data.serviceSlug,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      organisation: parsed.data.organisation,
      quantity: parsed.data.quantity,
      message: parsed.data.message,
      preferredContact: parsed.data.preferredContact,
    })
  } catch (error) {
    if (error instanceof WriteAccessUnavailableError) {
      return failure('We cannot save requests right now. Please message us on WhatsApp instead.', values)
    }
    if (isDomainError(error)) return failure(error.message, values)
    console.error('submitServiceRequestAction failed', error)
    return failure('Something went wrong. Please try again.', values)
  }

  return success('Thanks. We will be in touch within one working day.')
}
