import {ProductGridSkeleton} from '@/presentation/components/skeletons'

export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 sm:pt-12">
      <div className="mb-6 flex flex-col gap-5">
        <div className="h-11 w-full animate-pulse rounded-full bg-surface-sunken" />
        <div className="h-10 w-56 animate-pulse rounded-md bg-surface-sunken" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-9 w-24 animate-pulse rounded-full bg-surface-sunken" />
          ))}
        </div>
      </div>
      <ProductGridSkeleton count={8} />
    </div>
  )
}
