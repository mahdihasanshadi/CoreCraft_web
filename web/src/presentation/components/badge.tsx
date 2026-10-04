import type {ReactNode} from 'react'

type BadgeTone = 'neutral' | 'sale' | 'success' | 'accent'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-ink-muted',
  sale: 'bg-sale text-on-accent',
  success: 'bg-success-soft text-success',
  accent: 'bg-accent-soft text-accent-strong',
}

export function Badge({tone = 'neutral', children}: {tone?: BadgeTone; children: ReactNode}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
