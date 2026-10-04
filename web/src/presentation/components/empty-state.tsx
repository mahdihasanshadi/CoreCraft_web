interface EmptyStateProps {
  readonly title: string
  readonly description: string
  readonly action?: {readonly label: string; readonly href: string}
}

export function EmptyState({title, description, action}: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
          <path d="M4 7.5 12 12l8-4.5M12 12v9" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted text-pretty">
        {description}
      </p>
      {action && (
        <a
          href={action.href}
          className="mt-6 inline-flex items-center rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong"
        >
          {action.label}
        </a>
      )}
    </div>
  )
}
