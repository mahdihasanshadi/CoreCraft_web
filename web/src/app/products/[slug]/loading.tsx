import {ProductDetailSkeleton} from '@/presentation/components/skeletons'

export default function ProductLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-10">
      <div className="mb-8 h-4 w-40 animate-pulse rounded bg-surface-sunken" />
      <ProductDetailSkeleton />
    </div>
  )
}
