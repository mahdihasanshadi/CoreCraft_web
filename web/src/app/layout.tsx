import type {Metadata} from 'next'
import {Geist, Geist_Mono} from 'next/font/google'
import {draftMode} from 'next/headers'
import {VisualEditing} from 'next-sanity/visual-editing'

import {services} from '@/composition/container'
import {SanityLive} from '@/infrastructure/sanity/live'
import {SiteFooter} from '@/presentation/components/site-footer'
import {SiteHeader} from '@/presentation/components/site-header'

import './globals.css'

const geistSans = Geist({variable: '--font-geist-sans', subsets: ['latin']})
const geistMono = Geist_Mono({variable: '--font-geist-mono', subsets: ['latin']})

export const metadata: Metadata = {
  metadataBase: new URL(services.storefront.siteUrl),
  title: {default: 'CoreCraft', template: '%s · CoreCraft'},
  description: 'Crafted goods, managed in Sanity and served by Next.js.',
}

export default async function RootLayout({children}: LayoutProps<'/'>) {
  const {isEnabled: isDraftMode} = await draftMode()

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <SiteFooter />
        <SanityLive />
        {isDraftMode && <VisualEditing />}
      </body>
    </html>
  )
}
