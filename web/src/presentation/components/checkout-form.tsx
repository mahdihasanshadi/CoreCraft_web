'use client'

import Link from 'next/link'
import {useActionState, useId, useState} from 'react'

import {idleState, type ActionState} from '../actions/action-state'
import type {CheckoutViewModel} from '../view-models/cart'
import {FormNotice, Honeypot, SubmitButton, TextAreaField, TextField} from './form-fields'

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>

export function CheckoutForm({view, action}: {view: CheckoutViewModel; action: Action}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const id = useId()
  const v = state.values
  const e = state.fieldErrors
  const [zone, setZone] = useState<'insideDhaka' | 'outsideDhaka'>(
    v.zone === 'outsideDhaka' ? 'outsideDhaka' : 'insideDhaka',
  )
  const deliveryLabel = zone === 'insideDhaka' ? view.deliveryInsideLabel : view.deliveryOutsideLabel

  return (
    <form action={formAction} className="relative flex flex-col gap-8">
      <Honeypot />
      <FormNotice status={state.status} message={state.message} />
      {e.items && (
        <p role="alert" className="rounded-control border border-sale/30 bg-sale-soft px-3.5 py-2.5 text-sm text-sale">
          {e.items}{' '}
          <Link href="/cart" className="font-semibold underline-offset-4 hover:underline">
            Review your bag
          </Link>
        </p>
      )}

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Delivery details</h2>
          {!view.signedIn && (
            <p className="text-sm text-ink-muted">
              <Link href="/account/login?next=/checkout" className="font-medium text-accent underline-offset-4 hover:underline">
                Sign in
              </Link>{' '}
              to fill this in faster
            </p>
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id={`${id}-name`} name="name" label="Full name" autoComplete="name" defaultValue={v.name ?? view.prefill.name} error={e.name} required />
          <TextField
            id={`${id}-phone`}
            name="phone"
            label="Mobile number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            hint="We call this number to confirm before dispatch."
            defaultValue={v.phone ?? view.prefill.phone}
            error={e.phone}
            required
          />
          <TextField id={`${id}-email`} name="email" label="Email" type="email" autoComplete="email" defaultValue={v.email ?? view.prefill.email} error={e.email} optional />
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="text-sm font-medium text-ink">Delivery zone</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60">
              <input type="radio" name="zone" value="insideDhaka" checked={zone === 'insideDhaka'} onChange={() => setZone('insideDhaka')} className="mt-0.5 accent-[var(--color-accent)]" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">Inside Dhaka</span>
                <span className="text-xs text-ink-muted">{view.deliveryInsideLabel} · 1 to 2 days</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60">
              <input type="radio" name="zone" value="outsideDhaka" checked={zone === 'outsideDhaka'} onChange={() => setZone('outsideDhaka')} className="mt-0.5 accent-[var(--color-accent)]" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">Outside Dhaka</span>
                <span className="text-xs text-ink-muted">{view.deliveryOutsideLabel} · 2 to 4 days</span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField id={`${id}-line1`} name="line1" label="Street address" autoComplete="address-line1" placeholder="House, road, block" defaultValue={v.line1} error={e.line1} required />
          </div>
          <TextField id={`${id}-line2`} name="line2" label="Apartment, floor" autoComplete="address-line2" defaultValue={v.line2} error={e.line2} optional />
          <TextField id={`${id}-area`} name="area" label="Area / Thana" defaultValue={v.area} error={e.area} optional />
          <TextField id={`${id}-city`} name="city" label="City / District" autoComplete="address-level2" defaultValue={v.city ?? (zone === 'insideDhaka' ? 'Dhaka' : '')} error={e.city} required />
          <TextField id={`${id}-postal`} name="postalCode" label="Postal code" autoComplete="postal-code" inputMode="numeric" defaultValue={v.postalCode} error={e.postalCode} optional />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Payment</h2>
        <div className="flex items-start gap-3 rounded-control border border-accent/40 bg-accent-soft/50 p-4">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
          <div>
            <p className="text-sm font-medium text-ink">Cash on delivery</p>
            <p className="text-xs text-ink-muted">Pay the courier in cash when your order arrives. Nothing is charged now.</p>
          </div>
        </div>
      </section>

      <TextAreaField id={`${id}-note`} name="note" label="Note for us" hint="Landmarks, delivery times, anything else." defaultValue={v.note} error={e.note} optional />

      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface-muted/60 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Subtotal</span>
          <span className="tabular-nums text-ink">{view.subtotalLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Delivery ({zone === 'insideDhaka' ? 'inside Dhaka' : 'outside Dhaka'})</span>
          <span className="tabular-nums text-ink">{deliveryLabel}</span>
        </div>
        {view.freeDeliveryNudge && <p className="text-xs text-success">{view.freeDeliveryNudge}</p>}
        <SubmitButton pending={pending}>Place order</SubmitButton>
        <p className="text-xs text-ink-faint">Stock is checked again when you place the order.</p>
      </div>
    </form>
  )
}
