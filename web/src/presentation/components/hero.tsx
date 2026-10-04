import Image from 'next/image'
import Link from 'next/link'

export interface HeroProps {
  readonly eyebrow: string | null
  readonly heading: string
  readonly text: string | null
  readonly image: {readonly src: string; readonly alt: string} | null
  readonly cta: {readonly label: string; readonly href: string} | null
  readonly secondaryCta: {readonly label: string; readonly href: string} | null
}

/**
 * Full-bleed photo with the headline set over a dark gradient. Without a
 * photo it falls back to a calm typographic block, so a half-filled Studio
 * never produces an empty black box.
 */
export function Hero({eyebrow, heading, text, image, cta, secondaryCta}: HeroProps) {
  if (!image) {
    return (
      <section className="mx-auto w-full max-w-6xl px-6 pt-12 sm:pt-16">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-accent">{eyebrow}</p>}
          <h1 className="text-4xl font-semibold tracking-tight text-ink text-balance sm:text-6xl">{heading}</h1>
          {text && <p className="mt-5 text-lg leading-relaxed text-ink-muted text-pretty">{text}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {cta && (
              <Link href={cta.href} className="btn-primary">
                {cta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link href={secondaryCta.href} className="btn-secondary">
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative isolate">
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/9] lg:aspect-[21/9] lg:max-h-[640px]">
        <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10 sm:bg-gradient-to-r sm:from-black/70 sm:via-black/35 sm:to-transparent"
        />
      </div>
      <div className="absolute inset-0 flex items-end sm:items-center">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 sm:pb-0">
          <div className="max-w-xl text-white">
            {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">{eyebrow}</p>}
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">{heading}</h1>
            {text && <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 text-pretty sm:text-lg">{text}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              {cta && (
                <Link
                  href={cta.href}
                  className="inline-flex h-11 items-center justify-center rounded-control bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
                >
                  {cta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex h-11 items-center justify-center rounded-control border border-white/50 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
