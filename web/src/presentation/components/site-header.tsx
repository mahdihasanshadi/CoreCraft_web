import Link from 'next/link'

import {CartButton} from './cart-button'

export interface SiteHeaderProps {
  readonly storeName: string
  readonly announcement: {readonly text: string; readonly href: string | null} | null
  readonly accountsEnabled: boolean
  readonly navigation: readonly {readonly href: string; readonly label: string}[]
}

/**
 * Desktop: logo, garment-type navigation, search, account, bag. Phones: a
 * centred logo with search and bag; the rest lives in the bottom tab bar.
 */
export function SiteHeader({storeName, announcement, accountsEnabled, navigation}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40">
      {announcement && (
        <div className="bg-ink text-canvas">
          <p className="mx-auto flex h-9 w-full max-w-6xl items-center justify-center px-6 text-center text-xs font-medium tracking-wide">
            {announcement.href ? (
              <Link href={announcement.href} className="underline-offset-4 hover:underline">
                {announcement.text}
              </Link>
            ) : (
              announcement.text
            )}
          </p>
        </div>
      )}

      <div className="border-b border-line bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/75">
        <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <nav aria-label="Primary" className="hidden sm:block">
            <ul className="flex items-center gap-0.5">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/search" aria-label="Search" className="grid h-10 w-10 place-items-center rounded-control text-ink sm:hidden">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4" />
            </svg>
          </Link>

          <Link href="/" className="group flex items-center gap-2.5 justify-self-center rounded-control text-ink" aria-label={`${storeName} home`}>
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-md bg-ink text-canvas transition-transform duration-300 ease-out-soft group-hover:rotate-[-8deg]"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M8 1.5 14.5 5v6L8 14.5 1.5 11V5L8 1.5Zm0 2.3L3.5 6.3v3.4L8 12.2l4.5-2.5V6.3L8 3.8Z" />
              </svg>
            </span>
            <span className="text-[17px] font-bold uppercase tracking-[0.08em]">{storeName}</span>
          </Link>

          <div className="flex items-center justify-self-end gap-0.5">
            <Link
              href="/search"
              aria-label="Search"
              className="hidden h-9 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink sm:inline-flex"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4" />
              </svg>
              <span className="hidden lg:inline">Search</span>
            </Link>
            {accountsEnabled && (
              <Link
                href="/account"
                aria-label="Account"
                className="hidden h-9 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink sm:inline-flex"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
                </svg>
                <span className="hidden lg:inline">Account</span>
              </Link>
            )}
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  )
}
