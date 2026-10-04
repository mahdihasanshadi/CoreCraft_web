'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useEffect, useState} from 'react'

const CART_COOKIE = 'cc_cart'

function readCount(): number {
  try {
    const entry = document.cookie.split('; ').find((part) => part.startsWith(`${CART_COOKIE}=`))
    if (!entry) return 0
    const parsed = JSON.parse(decodeURIComponent(entry.slice(CART_COOKIE.length + 1))) as {items?: {quantity?: number}[]}
    return (parsed.items ?? []).reduce((total, item) => total + (Number(item.quantity) || 0), 0)
  } catch {
    return 0
  }
}

const tabs = [
  {href: '/', label: 'Home', icon: <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />},
  {href: '/shop', label: 'Shop', icon: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />},
  {href: '/search', label: 'Search', icon: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4" />},
  {href: '/cart', label: 'Bag', icon: <path d="M6 8h12l-1 12H7L6 8Zm3 0V6a3 3 0 0 1 6 0v2" />},
  {href: '/account', label: 'Account', icon: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />},
] as const

/** Phone navigation, the way local shops do it. Hidden from the tablet size up. */
export function MobileTabBar({accountsEnabled}: {accountsEnabled: boolean}) {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => setCount(readCount())
    refresh()
    window.addEventListener('cart:changed', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('cart:changed', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [pathname])

  const visible = tabs.filter((tab) => accountsEnabled || tab.href !== '/account')

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md sm:hidden"
      style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
    >
      <ul className="grid h-16" style={{gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))`}}>
        {visible.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                  {tab.icon}
                </svg>
                {tab.label}
                {tab.href === '/cart' && count > 0 && (
                  <span className="absolute right-[calc(50%-18px)] top-2 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
