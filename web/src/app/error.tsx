'use client'

import Link from 'next/link'
import {useEffect} from 'react'

export default function ErrorPage({error, reset}: {error: Error & {digest?: string}; reset: () => void}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink text-balance sm:text-4xl">
        That did not go as planned
      </h1>
      <p className="mt-4 max-w-md text-ink-muted text-pretty">
        The page hit an error while loading. It has been logged. Try again, or head back to the shop.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-faint">Ref {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-control bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-strong"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-control border border-line px-5 text-sm font-medium text-ink hover:border-line-strong"
        >
          Back to the shop
        </Link>
      </div>
    </div>
  )
}
