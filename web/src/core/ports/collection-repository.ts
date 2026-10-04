import type {Collection, CollectionSummary} from '../domain/collection'

export interface CollectionRepository {
  listAll(): Promise<readonly CollectionSummary[]>
  findBySlug(slug: string): Promise<Collection | null>
  /** Collections that have at least one purchasable product, products included. */
  listWithProducts(): Promise<readonly Collection[]>
}
