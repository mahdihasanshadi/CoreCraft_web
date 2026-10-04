import type {Category} from '../domain/taxonomy'

export interface CategoryRepository {
  /** Every category with its purchasable product count. */
  listAll(): Promise<readonly Category[]>
  findBySlug(slug: string): Promise<Category | null>
}
