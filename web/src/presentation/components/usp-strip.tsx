const icons = [
  // cash
  <path key="cash" d="M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />,
  // truck
  <path key="truck" d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  // exchange
  <path key="swap" d="M4 8h13l-3-3M20 16H7l3 3" />,
  // pin
  <path key="pin" d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />,
  // check
  <path key="check" d="m5 12.5 4.5 4.5L19 7.5" />,
]

/** The promises under the hero. Icons cycle so any count up to five works. */
export function UspStrip({items}: {items: readonly string[]}) {
  if (items.length === 0) return null
  return (
    <section aria-label="Why shop with us" className="border-y border-line bg-surface-muted/60">
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-3 px-6 py-4 text-sm sm:grid-cols-4 sm:py-5">
        {items.slice(0, 5).map((item, index) => (
          <li key={item} className="flex items-center gap-2.5 text-ink">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icons[index % icons.length]}
            </svg>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
