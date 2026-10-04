export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {year} CoreCraft</p>
        <p>Content managed in Sanity. Storefront built with Next.js.</p>
      </div>
    </footer>
  )
}
