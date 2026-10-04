export default function ServicesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16" role="status" aria-label="Loading services">
      <div className="mb-12 max-w-2xl">
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-surface-sunken" />
        <div className="h-11 w-4/5 animate-pulse rounded-md bg-surface-sunken" />
        <div className="mt-4 h-5 w-3/5 animate-pulse rounded bg-surface-sunken" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-5">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-36 animate-pulse rounded-card bg-surface-sunken" />
          ))}
        </div>
        <div className="h-[28rem] animate-pulse rounded-card bg-surface-sunken" />
      </div>
    </div>
  )
}
