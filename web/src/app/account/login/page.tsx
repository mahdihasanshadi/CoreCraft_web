import type {Metadata} from 'next'
import {redirect} from 'next/navigation'

import {services, useCases} from '@/composition/container'
import {loginAction} from '@/presentation/actions/auth'
import {AuthForm} from '@/presentation/components/auth-form'
import {safeNextPath} from '@/presentation/forms/schemas'

export const metadata: Metadata = {title: 'Sign in', robots: {index: false}}

export default async function LoginPage({searchParams}: PageProps<'/account/login'>) {
  if (!services.accountsEnabled) redirect('/')
  const {next} = await searchParams
  const nextPath = safeNextPath(typeof next === 'string' ? next : null)
  if (await useCases.getCurrentCustomer()) redirect(nextPath)

  return (
    <div className="mx-auto w-full max-w-md px-6 pb-20 pt-12 sm:pt-16">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 mb-8 text-ink-muted">Use the mobile number you registered with.</p>
      <AuthForm mode="login" action={loginAction} next={nextPath === '/account' ? null : nextPath} />
    </div>
  )
}
