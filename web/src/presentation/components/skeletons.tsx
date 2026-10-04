function Bone({className}: {className: string}) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-surface-sunken ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <Bone className="aspect-[4/5] rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Bone className="h-2.5 w-16" />
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-full" />
        <Bone className="mt-2 h-4 w-20" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({count = 6}: {count?: number}) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({length: count}, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14" role="status" aria-label="Loading product">
      <div className="flex flex-col gap-3">
        <Bone className="aspect-square rounded-card" />
        <div className="flex gap-2.5">
          <Bone className="h-20 w-20" />
          <Bone className="h-20 w-20" />
          <Bone className="h-20 w-20" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Bone className="h-3 w-20" />
        <Bone className="h-9 w-4/5" />
        <Bone className="h-8 w-32" />
        <Bone className="h-4 w-24" />
        <Bone className="mt-4 h-4 w-full" />
        <Bone className="h-4 w-11/12" />
        <Bone className="h-4 w-3/4" />
      </div>
    </div>
  )
}
