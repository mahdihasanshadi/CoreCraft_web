'use client'

import Link from 'next/link'
import {useEffect, useState} from 'react'

const CART_COOKIE = 'cc_cart'

function readCount(): number {
  try {
    const entry = document.cookie.split('; ').find((part) => part.startsWith(`${CART_COOKIE}=`))
    if (!entry) return 0
    const parsed = JSON.parse(decodeURIComponent(entry.slice(CART_COOKIE.length + 1))) as {
      items?: {quantity?: number}[]
    }
    return (parsed.items ?? []).reduce((total, item) => total + (Number(item.quantity) || 0), 0)
  } catch {
    return 0
  }
}

/**
 * Reads the bag count from the cart cookie on the client, so every page can
 * stay static while the badge is still right. Updates when an add-to-bag
 * action announces a change, and whenever the tab regains focus.
 */
export function CartButton() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => setCount(readCount())
    refresh()
    window.addEventListener('cart:changed', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    return () => {
      window.removeEventListener('cart:changed', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
    }
  }, [])

  return (
    <Link
      href="/cart"
      aria-label={count === 0 ? 'Bag, empty' : `Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
      className="relative inline-flex h-9 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      <span className="hidden sm:inline">Bag</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold text-on-accent tabular-nums">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
