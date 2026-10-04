import type {Metadata} from 'next'
import Image from 'next/image'

import {services as registry, useCases} from '@/composition/container'
import {submitServiceRequestAction} from '@/presentation/actions/submit-service-request'
import {RichTextRenderer} from '@/presentation/components/rich-text'
import {ServiceRequestForm} from '@/presentation/components/service-request-form'
import {formatMoney} from '@/presentation/formatting/money'

export const metadata: Metadata = {
  title: 'Custom kits and bulk orders',
  description: 'Team kits, corporate tees and name-and-number printing, made to order.',
}

export default async function ServicesPage({searchParams}: PageProps<'/services'>) {
  const [{service: preselected}, list] = await Promise.all([searchParams, useCases.listServices()])
  const locale = registry.storefront.locale
  const defaultSlug = typeof preselected === 'string' ? preselected : null

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Made to order</p>
        <h1 className="text-4xl font-semibold tracking-tight text-ink text-balance sm:text-5xl">
          Kits for your team, tees for your crew.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted text-pretty">
          The same fabrics and printing as our shop pieces, in your colours and your quantities. Tell us
          what you need and we will quote within a working day.
        </p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <section aria-labelledby="services-heading" className="flex flex-col gap-5">
          <h2 id="services-heading" className="sr-only">
            Services
          </h2>
          {list.length === 0 && (
            <p className="text-ink-muted">No services are listed yet. Use the form to tell us what you need.</p>
          )}
          {list.map((service) => (
            <article
              key={service.id}
              id={service.slug}
              className="grid gap-5 rounded-card border border-line bg-surface p-5 sm:grid-cols-[112px_1fr]"
            >
              <div className="relative aspect-square overflow-hidden rounded-control bg-surface-sunken">
                {service.image ? (
                  <Image
                    src={registry.imageUrls.resolve(service.image, {width: 224, height: 224})}
                    alt={service.image.alt ?? service.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-accent" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-ink">{service.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{service.summary}</p>
                <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-faint">
                  {service.startingPrice && (
                    <div className="flex gap-1">
                      <dt>From</dt>
                      <dd className="font-medium text-ink">{formatMoney(service.startingPrice, locale)}</dd>
                    </div>
                  )}
                  {service.minimumQuantity && (
                    <div className="flex gap-1">
                      <dt>Minimum</dt>
                      <dd className="font-medium text-ink">{service.minimumQuantity} pcs</dd>
                    </div>
                  )}
                  {service.turnaroundDays !== null && (
                    <div className="flex gap-1">
                      <dt>Turnaround</dt>
                      <dd className="font-medium text-ink">
                        {service.turnaroundDays === 0 ? 'Same day' : `${service.turnaroundDays} days`}
                      </dd>
                    </div>
                  )}
                </dl>
                {service.description.length > 0 && (
                  <div className="mt-2 text-sm">
                    <RichTextRenderer value={service.description} images={registry.imageUrls} />
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section aria-labelledby="request-heading" className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="request-heading" className="mb-4 text-lg font-semibold tracking-tight text-ink">
            Request a quote
          </h2>
          <ServiceRequestForm
            services={list.map(({slug, title}) => ({slug, title}))}
            defaultServiceSlug={defaultSlug}
            action={submitServiceRequestAction}
          />
        </section>
      </div>
    </div>
  )
}
