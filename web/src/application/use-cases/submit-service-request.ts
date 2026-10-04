import type {NewServiceRequest} from '@/core/domain/service'
import type {ServiceRepository, ServiceRequestRepository} from '@/core/ports/commerce-repositories'

export interface SubmitServiceRequestInput extends Omit<NewServiceRequest, 'serviceId' | 'serviceTitle'> {
  /** Slug of the service the shopper picked, if any. */
  readonly serviceSlug: string | null
}

export interface SubmitServiceRequestDeps {
  readonly services: ServiceRepository
  readonly requests: ServiceRequestRepository
}

export type SubmitServiceRequest = (input: SubmitServiceRequestInput) => Promise<{id: string}>

/**
 * Looks the service up by slug so the stored request carries the canonical
 * title and ID, not whatever label the form happened to show.
 */
export function makeSubmitServiceRequest({services, requests}: SubmitServiceRequestDeps): SubmitServiceRequest {
  return async function submitServiceRequest(input) {
    const service = input.serviceSlug ? await services.findBySlug(input.serviceSlug) : null
    return requests.create({
      serviceId: service?.id ?? null,
      serviceTitle: service?.title ?? null,
      name: input.name,
      phone: input.phone,
      email: input.email,
      organisation: input.organisation,
      quantity: input.quantity,
      message: input.message,
      preferredContact: input.preferredContact,
    })
  }
}
