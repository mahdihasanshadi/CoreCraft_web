import {ProductNotFoundError} from '@/core/domain/errors'
import type {InterestKind} from '@/core/domain/service'
import type {ProductInterestRepository} from '@/core/ports/commerce-repositories'
import type {ProductRepository} from '@/core/ports/product-repository'

export interface RecordProductInterestInput {
  readonly kind: InterestKind
  readonly productSlug: string
  readonly variantId: string | null
  readonly phone: string | null
  readonly email: string | null
  readonly note: string | null
}

export interface RecordProductInterestDeps {
  readonly products: ProductRepository
  readonly interest: ProductInterestRepository
}

export type RecordProductInterest = (input: RecordProductInterestInput) => Promise<{id: string}>

/**
 * Snapshots the product identity from the catalogue rather than trusting the
 * form, so the team's insights are keyed on real product IDs.
 */
export function makeRecordProductInterest({products, interest}: RecordProductInterestDeps): RecordProductInterest {
  return async function recordProductInterest(input) {
    const product = await products.findBySlug(input.productSlug)
    if (!product) throw new ProductNotFoundError(input.productSlug)

    const variant = input.variantId
      ? (product.variants.find((candidate) => candidate.id === input.variantId) ?? null)
      : null

    return interest.record({
      kind: input.kind,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: variant?.id ?? null,
      size: variant?.size ?? null,
      colour: variant?.colour ?? null,
      phone: input.phone,
      email: input.email,
      note: input.note,
    })
  }
}
