export interface SiteFooterProps {
  readonly storeName: string
  readonly tagline: string | null
  readonly contactEmail: string | null
  readonly contactPhone: string | null
  readonly whatsapp: string | null
  readonly social: Readonly<Record<'facebook' | 'instagram' | 'tiktok' | 'youtube', string | null>>
}

const socialLabels: Record<keyof SiteFooterProps['social'], string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

export function SiteFooter({
  storeName,
  tagline,
  contactEmail,
  contactPhone,
  whatsapp,
  social,
}: SiteFooterProps) {
  const year = new Date().getFullYear()
  const socialLinks = (Object.keys(socialLabels) as (keyof typeof socialLabels)[])
    .filter((key) => social[key])
    .map((key) => ({key, label: socialLabels[key], href: social[key] as string}))
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}` : null

  return (
    <footer className="mt-auto border-t border-line bg-surface-muted/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <p className="text-base font-semibold tracking-tight text-ink">{storeName}</p>
          {tagline && <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{tagline}</p>}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Contact</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
            {contactPhone && (
              <li>
                <a href={`tel:${contactPhone.replace(/[^0-9+]/g, '')}`} className="hover:text-ink">
                  {contactPhone}
                </a>
              </li>
            )}
            {whatsappHref && (
              <li>
                <a href={whatsappHref} rel="noopener noreferrer" target="_blank" className="hover:text-ink">
                  WhatsApp
                </a>
              </li>
            )}
            {contactEmail && (
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-ink">
                  {contactEmail}
                </a>
              </li>
            )}
          </ul>
        </div>

        {socialLinks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">Follow</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
              {socialLinks.map((link) => (
                <li key={link.key}>
                  <a href={link.href} rel="noopener noreferrer" target="_blank" className="hover:text-ink">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-6 py-5 text-xs text-ink-faint">
          &copy; {year} {storeName}. Content managed in Sanity.
        </p>
      </div>
    </footer>
  )
}
