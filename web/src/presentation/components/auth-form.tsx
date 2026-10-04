'use client'

import Link from 'next/link'
import {useActionState, useId} from 'react'

import {idleState, type ActionState} from '../actions/action-state'
import {FormNotice, Honeypot, SubmitButton, TextField} from './form-fields'

type Action = (previous: ActionState, formData: FormData) => Promise<ActionState>

export function AuthForm({mode, action, next}: {mode: 'login' | 'register'; action: Action; next: string | null}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  const id = useId()
  const v = state.values
  const e = state.fieldErrors
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : ''

  return (
    <form action={formAction} className="relative flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
      {mode === 'register' && <Honeypot />}
      {next && <input type="hidden" name="next" value={next} />}
      <FormNotice status={state.status} message={state.message} />

      {mode === 'register' && (
        <TextField id={`${id}-name`} name="name" label="Your name" autoComplete="name" defaultValue={v.name} error={e.name} required />
      )}
      <TextField
        id={`${id}-phone`}
        name="phone"
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="01XXXXXXXXX"
        hint={mode === 'register' ? 'This is how you sign in and how we reach you about orders.' : undefined}
        defaultValue={v.phone}
        error={e.phone}
        required
      />
      {mode === 'register' && (
        <TextField id={`${id}-email`} name="email" label="Email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} optional />
      )}
      <TextField
        id={`${id}-password`}
        name="password"
        label="Password"
        type="password"
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        minLength={mode === 'register' ? 8 : undefined}
        hint={mode === 'register' ? 'At least 8 characters.' : undefined}
        error={e.password}
        required
      />
      {mode === 'register' && (
        <TextField
          id={`${id}-confirm`}
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={e.confirmPassword}
          required
        />
      )}

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-sm text-ink-muted">
          {mode === 'login' ? (
            <>
              New here?{' '}
              <Link href={`/account/register${nextQuery}`} className="font-medium text-accent underline-offset-4 hover:underline">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have one?{' '}
              <Link href={`/account/login${nextQuery}`} className="font-medium text-accent underline-offset-4 hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
        <SubmitButton pending={pending}>{mode === 'login' ? 'Sign in' : 'Create account'}</SubmitButton>
      </div>
    </form>
  )
}
