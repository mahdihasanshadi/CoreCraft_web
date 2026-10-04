import Link from 'next/link'

export interface FilterChip {
  readonly key: string
  readonly label: string
  readonly href: string
  readonly count: number
  readonly active: boolean
}

/**
 * Plain links, so filtering works without JavaScript and every state has a
 * URL that can be shared or bookmarked.
 */
export function FilterChips({chips, label}: {chips: readonly FilterChip[]; label: string}) {
  return (
    <nav aria-label={label}>
      <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <li key={chip.key} className="shrink-0">
            <Link
              href={chip.href}
              aria-current={chip.active ? 'page' : undefined}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                chip.active
                  ? 'border-ink bg-ink text-canvas'
                  : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink'
              }`}
            >
              {chip.label}
              <span className={`text-xs tabular-nums ${chip.active ? 'text-canvas/70' : 'text-ink-faint'}`}>
                {chip.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
