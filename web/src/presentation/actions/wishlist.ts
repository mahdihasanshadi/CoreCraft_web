'use server'

import {useCases} from '@/composition/container'
import {isDomainError} from '@/core/domain/errors'

/**
 * A heart tap. Records a wishlist signal so the team sees demand; failures
 * are swallowed because a heart must never show an error dialog.
 */
export async function wishlistAction(formData: FormData): Promise<void> {
  const productSlug = formData.get('productSlug')
  if (typeof productSlug !== 'string' || !/^[a-z0-9-]{1,120}$/.test(productSlug)) return
  try {
    await useCases.recordProductInterest({
      kind: 'wishlist',
      productSlug,
      variantId: null,
      phone: null,
      email: null,
      note: null,
    })
  } catch (error) {
    if (!isDomainError(error)) console.error('wishlistAction failed', error)
  }
}
