/** A plain GET form, so the URL is the state and the back button works. */
export function SearchBox({defaultValue = '', autoFocus = false, size = 'md'}: {defaultValue?: string; autoFocus?: boolean; size?: 'md' | 'lg'}) {
  const height = size === 'lg' ? 'h-14 text-base' : 'h-11 text-sm'
  return (
    <form action="/search" role="search" className="relative w-full">
      <label htmlFor="search-q" className="sr-only">
        Search products
      </label>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4" />
      </svg>
      <input
        id="search-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        placeholder="Search jerseys, tees, teams…"
        className={`${height} w-full rounded-full border border-line bg-surface pl-11 pr-24 text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none`}
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 inline-flex h-[calc(100%-12px)] -translate-y-1/2 items-center rounded-full bg-ink px-4 text-sm font-semibold text-canvas hover:bg-accent-strong hover:text-on-accent"
      >
        Search
      </button>
    </form>
  )
}
