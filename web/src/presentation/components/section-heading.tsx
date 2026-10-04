import Link from 'next/link'

export interface SectionHeadingProps {
  readonly eyebrow?: string
  readonly title: string
  readonly description?: string | null
  readonly href?: string
  readonly linkLabel?: string
  readonly id?: string
}

/** The one heading style every home-page section uses, so the rhythm holds. */
export function SectionHeading({eyebrow, title, description, href, linkLabel = 'View all', id}: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-6 sm:mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
        )}
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-ink text-balance sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 whitespace-nowrap text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}
