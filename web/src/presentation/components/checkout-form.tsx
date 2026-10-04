'use client'

import {useActionState, useId, useState} from 'react'

import {idleState, type ActionState} from '../actions/action-state'
import type {CheckoutViewModel} from '../view-models/checkout'
import {FormNotice, Honeypot, RadioCard, SubmitButton, TextAreaField, TextField} from './form-fields'

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>

const paymentLabels: Record<CheckoutViewModel['paymentMethods'][number]['value'], {label: string; description: string}> = {
  cod: {label: 'Cash on delivery', description: 'Pay the courier when your order arrives.'},
  bkash: {label: 'bKash', description: 'Send Money to our merchant number, then share the transaction ID.'},
  nagad: {label: 'Nagad', description: 'Send Money to our merchant number, then share the transaction ID.'},
  card: {label: 'Card', description: 'Visa, Mastercard or Amex.'},
  bankTransfer: {label: 'Bank transfer', description: 'We send account details after you order.'},
}

export function CheckoutForm({view, action}: {view: CheckoutViewModel; action: Action}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const id = useId()
  const v = state.values
  const e = state.fieldErrors

  const [zone, setZone] = useState<'insideDhaka' | 'outsideDhaka'>(
    v.zone === 'outsideDhaka' ? 'outsideDhaka' : 'insideDhaka',
  )
  const [method, setMethod] = useState<string>(v.paymentMethod ?? view.paymentMethods[0]?.value ?? 'cod')
  const [wantsPrint, setWantsPrint] = useState(Boolean(v.printName || v.printNumber))

  const shippingLabel = zone === 'insideDhaka' ? view.shipping.insideDhakaLabel : view.shipping.outsideDhakaLabel
  const needsWalletDetails = method === 'bkash' || method === 'nagad'

  return (
    <form action={formAction} className="relative flex flex-col gap-8">
      <Honeypot />
      <input type="hidden" name="productSlug" value={view.item.productSlug} />
      {view.item.variantId && <input type="hidden" name="variantId" value={view.item.variantId} />}
      <input type="hidden" name="quantity" value={view.item.quantity} />

      <FormNotice status={state.status} message={state.message} />
      {e.variantId && <FormNotice status="error" message={e.variantId} />}

      {view.item.customisable && (
        <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={wantsPrint}
              onChange={(event) => setWantsPrint(event.target.checked)}
              className="mt-1 accent-[var(--color-accent)]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-ink">Add a printed name and number</span>
              <span className="text-xs text-ink-muted">{view.item.customisationFeeLabel} per jersey, heat-pressed in the official font.</span>
            </span>
          </label>
          {wantsPrint && (
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
              <TextField
                id={`${id}-print-name`}
                name="printName"
                label="Name on back"
                maxLength={14}
                placeholder="MESSI"
                defaultValue={v.printName}
                error={e.printName}
                optional
                style={{textTransform: 'uppercase'}}
              />
              <TextField
                id={`${id}-print-number`}
                name="printNumber"
                label="Number"
                inputMode="numeric"
                maxLength={2}
                placeholder="10"
                defaultValue={v.printNumber}
                error={e.printNumber}
                optional
              />
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Delivery details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id={`${id}-name`} name="name" label="Full name" autoComplete="name" defaultValue={v.name} error={e.name} required />
          <TextField
            id={`${id}-phone`}
            name="phone"
            label="Mobile number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            hint="We call this number to confirm before dispatch."
            defaultValue={v.phone}
            error={e.phone}
            required
          />
          <TextField id={`${id}-email`} name="email" label="Email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} optional />
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="text-sm font-medium text-ink">Delivery zone</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60">
              <input type="radio" name="zone" value="insideDhaka" checked={zone === 'insideDhaka'} onChange={() => setZone('insideDhaka')} className="mt-0.5 accent-[var(--color-accent)]" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">Inside Dhaka</span>
                <span className="text-xs text-ink-muted">{view.shipping.insideDhakaLabel} · 1 to 2 days</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60">
              <input type="radio" name="zone" value="outsideDhaka" checked={zone === 'outsideDhaka'} onChange={() => setZone('outsideDhaka')} className="mt-0.5 accent-[var(--color-accent)]" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">Outside Dhaka</span>
                <span className="text-xs text-ink-muted">{view.shipping.outsideDhakaLabel} · 2 to 4 days</span>
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

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Payment</h2>
        <div className="grid gap-2.5">
          {view.paymentMethods.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-control border border-line bg-surface p-3.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={method === option.value}
                onChange={() => setMethod(option.value)}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-ink">{paymentLabels[option.value].label}</span>
                <span className="text-xs text-ink-muted">{paymentLabels[option.value].description}</span>
              </span>
            </label>
          ))}
        </div>
        {e.paymentMethod && <FormNotice status="error" message={e.paymentMethod} />}

        {needsWalletDetails && (
          <div className="grid gap-4 rounded-card border border-dashed border-line-strong p-4 sm:grid-cols-2">
            <p className="text-sm text-ink-muted sm:col-span-2">
              Already paid? Add the details below. Otherwise we will send the merchant number after you order.
            </p>
            <TextField id={`${id}-sender`} name="senderNumber" label="Wallet number you paid from" type="tel" inputMode="tel" defaultValue={v.senderNumber} error={e.senderNumber} optional />
            <TextField id={`${id}-ref`} name="reference" label="Transaction ID" defaultValue={v.reference} error={e.reference} optional />
          </div>
        )}
      </section>

      <TextAreaField id={`${id}-note`} name="note" label="Note for us" hint="Landmarks, delivery times, anything else." defaultValue={v.note} error={e.note} optional />

      <div className="flex flex-col gap-3 rounded-card border border-line bg-surface-muted/60 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">Delivery ({zone === 'insideDhaka' ? 'inside Dhaka' : 'outside Dhaka'})</span>
          <span className="tabular-nums text-ink">{shippingLabel}</span>
        </div>
        <p className="text-xs text-ink-faint">
          Final total is confirmed on the next screen, after we check stock and apply any free-delivery threshold.
        </p>
        <SubmitButton pending={pending}>Place order</SubmitButton>
      </div>
    </form>
  )
}

/** Keeps `RadioCard` referenced for forms that use it directly. */
export {RadioCard}
