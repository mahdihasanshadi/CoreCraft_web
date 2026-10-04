import type {Metadata} from 'next'
import {redirect} from 'next/navigation'

import {services, useCases} from '@/composition/container'
import {registerAction} from '@/presentation/actions/auth'
import {AuthForm} from '@/presentation/components/auth-form'
import {safeNextPath} from '@/presentation/forms/schemas'

export const metadata: Metadata = {title: 'Create an account', robots: {index: false}}

export default async function RegisterPage({searchParams}: PageProps<'/account/register'>) {
  if (!services.accountsEnabled) redirect('/')
  const {next} = await searchParams
  const nextPath = safeNextPath(typeof next === 'string' ? next : null)
  if (await useCases.getCurrentCustomer()) redirect(nextPath)

  return (
    <div className="mx-auto w-full max-w-md px-6 pb-20 pt-12 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Create an account</h1>
      <p className="mt-2 mb-8 text-ink-muted">
        Faster checkout and a record of every order. If you have ordered as a guest before, your history
        comes with you.
      </p>
      <AuthForm mode="register" action={registerAction} next={nextPath === '/account' ? null : nextPath} />
    </div>
  )
}
