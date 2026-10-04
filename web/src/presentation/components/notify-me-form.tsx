'use client'

import {useActionState, useId} from 'react'

import {idleState, type ActionState} from '../actions/action-state'
import {FormNotice, SubmitButton, TextField} from './form-fields'

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>

export function NotifyMeForm({
  productSlug,
  variantId,
  sizeLabel,
  action,
}: {
  productSlug: string
  variantId: string | null
  sizeLabel: string | null
  action: Action
}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const id = useId()

  if (state.status === 'success') {
    return <FormNotice status="success" message={state.message} />
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="kind" value="notifyMe" />
      <input type="hidden" name="productSlug" value={productSlug} />
      {variantId && <input type="hidden" name="variantId" value={variantId} />}
      <p className="text-sm text-ink-muted">
        {sizeLabel ? `Size ${sizeLabel} is sold out.` : 'Sold out.'} Leave a number and we will tell you when it
        is back.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <TextField
          id={`${id}-phone`}
          name="phone"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          defaultValue={state.values.phone}
          error={state.fieldErrors.phone}
        />
        <SubmitButton pending={pending}>Notify me</SubmitButton>
      </div>
      <FormNotice status={state.status} message={state.status === 'error' ? state.message : null} />
    </form>
  )
}
