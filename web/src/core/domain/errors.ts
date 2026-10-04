/**
 * Base class for failures the domain itself recognises, as opposed to
 * transport or programming errors. Letting callers narrow on these keeps
 * "not found" from being confused with "the content store is down".
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ProductNotFoundError extends DomainError {
  readonly code = 'PRODUCT_NOT_FOUND'

  constructor(readonly slug: string) {
    super(`No product found for slug "${slug}"`)
  }
}

export class CollectionNotFoundError extends DomainError {
  readonly code = 'COLLECTION_NOT_FOUND'

  constructor(readonly slug: string) {
    super(`No collection found for slug "${slug}"`)
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}
