import {ProductGridSkeleton} from '@/presentation/components/skeletons'

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12 sm:pt-16">
      <div className="mb-10 max-w-2xl sm:mb-14">
        <div className="mb-3 h-3 w-24 animate-pulse rounded bg-surface-sunken" />
        <div className="h-11 w-4/5 animate-pulse rounded-md bg-surface-sunken" />
        <div className="mt-4 h-5 w-3/5 animate-pulse rounded bg-surface-sunken" />
      </div>
      <ProductGridSkeleton />
    </div>
  )
}
