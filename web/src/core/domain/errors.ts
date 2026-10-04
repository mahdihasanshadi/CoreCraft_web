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

export class OrderNotFoundError extends DomainError {
  readonly code = 'ORDER_NOT_FOUND'

  constructor(readonly orderNumber: string) {
    super(`No order found with number "${orderNumber}"`)
  }
}

/**
 * The shopper asked for something the shop cannot sell as requested. Each
 * problem is tied to a field so a form can show it in the right place.
 */
export class OrderValidationError extends DomainError {
  readonly code = 'ORDER_INVALID'

  constructor(readonly problems: readonly {field: string; message: string}[]) {
    super(problems.map((problem) => problem.message).join(' '))
  }
}

/** Writes need a server token that has not been configured. */
export class WriteAccessUnavailableError extends DomainError {
  readonly code = 'WRITE_ACCESS_UNAVAILABLE'

  constructor() {
    super('Saving is not configured on this server yet.')
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}
