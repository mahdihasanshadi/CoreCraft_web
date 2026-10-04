import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink text-balance sm:text-4xl">
        That page is not on the shelves
      </h1>
      <p className="mt-4 max-w-md text-ink-muted text-pretty">
        It may have been removed, renamed, or never existed. The rest of the shop is still here.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong"
      >
        Back to the shop
      </Link>
    </div>
  )
}
