import type {Collection, CollectionSummary} from '../domain/collection'

export interface CollectionRepository {
  listAll(): Promise<readonly CollectionSummary[]>
  findBySlug(slug: string): Promise<Collection | null>
}
