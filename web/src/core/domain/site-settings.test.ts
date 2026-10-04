import {describe, expect, it} from 'vitest'

import {createMoney} from './money'
import {emptySeoMetadata} from './seo'
import {shippingFeeFor, type SiteSettings} from './site-settings'

const bdt = (amount: number) => createMoney(amount, 'BDT')

const settings: SiteSettings = {
  storeName: 'CoreCraft',
  tagline: null,
  heroHeading: null,
  heroText: null,
  logo: null,
  announcement: null,
  contactEmail: null,
  contactPhone: null,
  whatsapp: null,
  social: {facebook: null, instagram: null, tiktok: null, youtube: null},
  shipping: {insideDhaka: bdt(70), outsideDhaka: bdt(130), freeFrom: bdt(2500)},
  enabledPaymentMethods: ['cod', 'bkash'],
  paymentInstructions: {bkashNumber: null, nagadNumber: null, bankDetails: null},
  jerseyCustomisationFee: bdt(150),
  defaultSeo: emptySeoMetadata,
}

describe('shippingFeeFor', () => {
  it('charges by zone below the threshold', () => {
    expect(shippingFeeFor(settings, 'insideDhaka', bdt(1000))).toEqual(bdt(70))
    expect(shippingFeeFor(settings, 'outsideDhaka', bdt(1000))).toEqual(bdt(130))
  })

  it('is free at and above the threshold, in either zone', () => {
    expect(shippingFeeFor(settings, 'insideDhaka', bdt(2500))).toEqual(bdt(0))
    expect(shippingFeeFor(settings, 'outsideDhaka', bdt(3000))).toEqual(bdt(0))
  })

  it('never goes free when no threshold is set', () => {
    const noThreshold = {...settings, shipping: {...settings.shipping, freeFrom: null}}
    expect(shippingFeeFor(noThreshold, 'insideDhaka', bdt(99999))).toEqual(bdt(70))
  })
})
