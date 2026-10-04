import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {services, useCases} from '@/composition/container'
import {SanityLive} from '@/infrastructure/sanity/live'
import {MobileTabBar} from '@/presentation/components/mobile-tab-bar'
import {SiteFooter} from '@/presentation/components/site-footer'
import {SiteHeader} from '@/presentation/components/site-header'
import {primaryNavigation} from '@/presentation/navigation'

import './globals.css'

const geistSans = Geist({variable: '--font-geist-sans', subsets: ['latin']})
const geistMono = Geist_Mono({variable: '--font-geist-mono', subsets: ['latin']})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await useCases.getSiteSettings()
  const title = settings.defaultSeo.title ?? settings.storeName
  const description = settings.defaultSeo.description ?? settings.tagline ?? undefined
  const shareImage = settings.defaultSeo.shareImage
    ? [{url: services.imageUrls.resolve(settings.defaultSeo.shareImage, {width: 1200, height: 630})}]
    : undefined

  return {
    metadataBase: new URL(services.storefront.siteUrl),
    title: {default: title, template: `%s · ${settings.storeName}`},
    description,
    openGraph: {title, description, images: shareImage, siteName: settings.storeName},
  }
}

export default async function RootLayout({children}: LayoutProps<'/'>) {
  const [{isEnabled: isDraftMode}, settings] = await Promise.all([draftMode(), useCases.getSiteSettings()])

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-16 sm:pb-0">
        <SiteHeader
          storeName={settings.storeName}
          announcement={settings.announcement}
          accountsEnabled={services.accountsEnabled}
          navigation={primaryNavigation}
        />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter
          storeName={settings.storeName}
          tagline={settings.tagline}
          contactEmail={settings.contactEmail}
          contactPhone={settings.contactPhone}
          whatsapp={settings.whatsapp}
          social={settings.social}
        />
        <MobileTabBar accountsEnabled={services.accountsEnabled} />
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
