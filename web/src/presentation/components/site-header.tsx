import Link from 'next/link'

export interface SiteHeaderProps {
  readonly storeName: string
  readonly announcement: {readonly text: string; readonly href: string | null} | null
}

const navigation = [
  {href: '/', label: 'Shop'},
  {href: '/services', label: 'Custom kits'},
] as const

export function SiteHeader({storeName, announcement}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40">
      {announcement && (
        <div className="bg-accent text-on-accent">
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

      <div className="border-b border-line bg-canvas/80 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/70">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-control text-ink"
            aria-label={`${storeName} home`}
          >
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center rounded-md bg-accent text-on-accent transition-transform duration-300 ease-out-soft group-hover:rotate-[-8deg]"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M8 1.5 14.5 5v6L8 14.5 1.5 11V5L8 1.5Zm0 2.3L3.5 6.3v3.4L8 12.2l4.5-2.5V6.3L8 3.8Z" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">{storeName}</span>
          </Link>

          <nav aria-label="Primary">
            <ul className="flex items-center gap-1">
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
        </div>
      </div>
    </header>
  )
}
