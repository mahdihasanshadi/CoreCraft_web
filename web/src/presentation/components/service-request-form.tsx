'use client'

import {useActionState, useId} from 'react'

import {idleState, type ActionState} from '../actions/action-state'
import {
  FormNotice,
  Honeypot,
  RadioCard,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from './form-fields'

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>

export function ServiceRequestForm({
  services,
  defaultServiceSlug,
  action,
}: {
  services: readonly {readonly slug: string; readonly title: string}[]
  defaultServiceSlug: string | null
  action: Action
}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const id = useId()

  if (state.status === 'success') {
    return (
      <div className="rounded-card border border-line bg-surface p-6">
        <FormNotice status="success" message={state.message} />
      </div>
    )
  }

  const v = state.values
  const e = state.fieldErrors

  return (
    <form action={formAction} className="relative flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
      <Honeypot />
      <FormNotice status={state.status} message={state.message} />

      <SelectField
        id={`${id}-service`}
        name="serviceSlug"
        label="What do you need?"
        options={services.map((service) => ({value: service.slug, label: service.title}))}
        placeholder="Choose a service"
        defaultValue={v.serviceSlug ?? defaultServiceSlug ?? ''}
        error={e.serviceSlug}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id={`${id}-name`} name="name" label="Your name" autoComplete="name" defaultValue={v.name} error={e.name} required />
        <TextField
          id={`${id}-phone`}
          name="phone"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          defaultValue={v.phone}
          error={e.phone}
          required
        />
        <TextField id={`${id}-email`} name="email" label="Email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} optional />
        <TextField id={`${id}-org`} name="organisation" label="Team or organisation" defaultValue={v.organisation} error={e.organisation} optional />
        <TextField
          id={`${id}-qty`}
          name="quantity"
          label="Approximate quantity"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={v.quantity}
          error={e.quantity}
          optional
        />
      </div>

      <TextAreaField
        id={`${id}-message`}
        name="message"
        label="Tell us about it"
        hint="Colours, sizes, deadline, artwork. Anything that helps us quote faster."
        defaultValue={v.message}
        error={e.message}
        optional
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="text-sm font-medium text-ink">How should we reach you?</legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <RadioCard name="preferredContact" value="phone" label="Call me" defaultChecked={!v.preferredContact || v.preferredContact === 'phone'} />
          <RadioCard name="preferredContact" value="whatsapp" label="WhatsApp" defaultChecked={v.preferredContact === 'whatsapp'} />
          <RadioCard name="preferredContact" value="email" label="Email" defaultChecked={v.preferredContact === 'email'} />
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-xs text-ink-faint">We reply within one working day.</p>
        <SubmitButton pending={pending}>Send request</SubmitButton>
      </div>
    </form>
  )
}
