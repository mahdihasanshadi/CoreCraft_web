import type {Collection} from '@/core/domain/collection'
import type {CollectionRepository} from '@/core/ports/collection-repository'

export type ListCollections = () => Promise<readonly Collection[]>

/** Collections worth showing: the ones with something in them. */
export function makeListCollections({collections}: {collections: CollectionRepository}): ListCollections {
  return function listCollections() {
    return collections.listWithProducts()
  }
}
