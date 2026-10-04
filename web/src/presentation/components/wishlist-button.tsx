'use client'

import {useSyncExternalStore, useTransition} from 'react'

const STORAGE_KEY = 'cc_wishlist'
const CHANGE_EVENT = 'wishlist:changed'

function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeSaved(saved: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]))
  } catch {
    // Storage can be unavailable in private mode; the heart still toggles for this page.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

type Action = (formData: FormData) => Promise<void>

/**
 * A heart that remembers itself in the browser and tells the server once, so
 * the team can see which products people keep coming back to. The saved
 * state is read as an external store: unsaved on the server, real on the
 * client, with no state set inside an effect.
 */
export function WishlistButton({productSlug, action, className = ''}: {productSlug: string; action: Action; className?: string}) {
  const saved = useSyncExternalStore(
    subscribe,
    () => readSaved().has(productSlug),
    () => false,
  )
  const [, startTransition] = useTransition()

  function toggle() {
    const next = readSaved()
    const nowSaved = !next.has(productSlug)
    if (nowSaved) next.add(productSlug)
    else next.delete(productSlug)
    writeSaved(next)
    if (nowSaved) {
      const data = new FormData()
      data.set('productSlug', productSlug)
      startTransition(() => {
        void action(data)
      })
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-ink shadow-card backdrop-blur-sm transition-transform hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill={saved ? 'var(--color-sale)' : 'none'}
        stroke={saved ? 'var(--color-sale)' : 'currentColor'}
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" />
      </svg>
    </button>
  )
}
