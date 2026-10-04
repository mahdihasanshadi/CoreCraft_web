'use client'

import Image from 'next/image'
import {useCallback, useId, useState, type KeyboardEvent} from 'react'

import type {GalleryImageViewModel} from '../view-models/product-detail'

export function ProductGallery({
  images,
  productName,
}: {
  images: readonly GalleryImageViewModel[]
  productName: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const labelId = useId()
  const active = images[activeIndex] ?? images[0]

  const onThumbnailKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (images.length < 2) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % images.length)
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + images.length) % images.length)
      } else if (event.key === 'Home') {
        event.preventDefault()
        setActiveIndex(0)
      } else if (event.key === 'End') {
        event.preventDefault()
        setActiveIndex(images.length - 1)
      }
    },
    [images.length],
  )

  if (!active) {
    return (
      <div className="grid aspect-square place-items-center rounded-card bg-surface-sunken text-sm text-ink-faint">
        No images yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <figure className="relative aspect-square overflow-hidden rounded-card bg-surface-sunken">
        <Image
          key={active.key}
          src={active.src}
          alt={active.alt}
          fill
          priority={activeIndex === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover animate-in fade-in duration-300"
        />
      </figure>

      {images.length > 1 && (
        <div
          role="group"
          aria-labelledby={labelId}
          onKeyDown={onThumbnailKeyDown}
          className="flex gap-2.5 overflow-x-auto pb-1"
        >
          <span id={labelId} className="sr-only">
            {productName} images
          </span>
          {images.map((image, index) => {
            const selected = index === activeIndex
            return (
              <button
                key={image.key}
                type="button"
                aria-pressed={selected}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-control border-2 bg-surface-sunken transition-colors ${
                  selected ? 'border-accent' : 'border-transparent hover:border-line-strong'
                }`}
              >
                <Image src={image.thumbnailSrc} alt="" fill sizes="80px" className="object-cover" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
