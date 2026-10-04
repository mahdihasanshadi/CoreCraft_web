/** The Fabrilife-style reassurance block under the buy button. */
export function TrustCard({items}: {items: readonly string[]}) {
  if (items.length === 0) return null
  return (
    <div className="rounded-card border border-line bg-surface-muted/60 p-4">
      <ul className="grid gap-2 text-sm text-ink sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
