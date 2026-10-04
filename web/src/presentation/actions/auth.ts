'use server'

import {redirect} from 'next/navigation'

import {useCases} from '@/composition/container'
import {
  AuthUnavailableError,
  InvalidCredentialsError,
  OrderValidationError,
  PhoneAlreadyRegisteredError,
  WriteAccessUnavailableError,
} from '@/core/domain/errors'

import {fieldErrorsFrom, loginFormSchema, registerFormSchema, safeNextPath} from '../forms/schemas'
import {failure, formValues, type ActionState} from './action-state'

const UNAVAILABLE = 'Accounts are not switched on yet. You can still check out as a guest.'

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = loginFormSchema.safeParse(values)
  if (!parsed.success) return failure('Check the highlighted field.', values, fieldErrorsFrom(parsed.error))

  try {
    await useCases.loginCustomer({phone: parsed.data.phone, password: parsed.data.password})
  } catch (error) {
    if (error instanceof InvalidCredentialsError) return failure(error.message, {phone: values.phone})
    if (error instanceof AuthUnavailableError || error instanceof WriteAccessUnavailableError) {
      return failure(UNAVAILABLE, {phone: values.phone})
    }
    console.error('loginAction failed', error)
    return failure('Something went wrong. Please try again.', {phone: values.phone})
  }

  redirect(safeNextPath(parsed.data.next))
}

export async function registerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData)
  const parsed = registerFormSchema.safeParse(values)
  const echo = {name: values.name, phone: values.phone, email: values.email, next: values.next}
  if (!parsed.success) return failure('Check the highlighted fields.', echo, fieldErrorsFrom(parsed.error))
  if (parsed.data.website) return failure('Something went wrong. Please try again.', echo)

  try {
    await useCases.registerCustomer({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      password: parsed.data.password,
    })
  } catch (error) {
    if (error instanceof PhoneAlreadyRegisteredError) return failure(error.message, echo, {phone: error.message})
    if (error instanceof OrderValidationError) {
      const fieldErrors = Object.fromEntries(error.problems.map((problem) => [problem.field, problem.message]))
      return failure('Check the highlighted fields.', echo, fieldErrors)
    }
    if (error instanceof AuthUnavailableError || error instanceof WriteAccessUnavailableError) {
      return failure(UNAVAILABLE, echo)
    }
    console.error('registerAction failed', error)
    return failure('Something went wrong. Please try again.', echo)
  }

  redirect(safeNextPath(parsed.data.next))
}

export async function logoutAction(): Promise<void> {
  await useCases.logoutCustomer()
  redirect('/')
}
