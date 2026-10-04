import Image from 'next/image'
import {PortableText, type PortableTextBlock, type PortableTextComponents} from 'next-sanity'

import {createImageRef} from '@/core/domain/image'
import type {RichText} from '@/core/domain/rich-text'
import type {ImageUrlResolver} from '@/core/ports/image-url-resolver'

/**
 * Renders editor-authored rich text.
 *
 * This is the one presentation module that knows the opaque `RichText` type
 * is Portable Text. Inline image blocks carry an asset reference, so the
 * resolver is injected rather than imported, keeping this component free of
 * any knowledge about where images are hosted.
 */

interface InlineImageValue {
  asset?: {_ref?: string}
  alt?: string
  hotspot?: {x?: number; y?: number}
}

const INLINE_IMAGE_WIDTH = 1200

function buildComponents(images: ImageUrlResolver): PortableTextComponents {
  return {
    types: {
      image: ({value}: {value: InlineImageValue}) => {
        const assetId = value.asset?._ref
        if (!assetId) return null
        const focalPoint =
          typeof value.hotspot?.x === 'number' && typeof value.hotspot?.y === 'number'
            ? {x: value.hotspot.x, y: value.hotspot.y}
            : null
        const ref = createImageRef(assetId, value.alt ?? null, focalPoint)
        return (
          <figure>
            <Image
              src={images.resolve(ref, {width: INLINE_IMAGE_WIDTH})}
              alt={value.alt ?? ''}
              width={INLINE_IMAGE_WIDTH}
              height={Math.round(INLINE_IMAGE_WIDTH * 0.66)}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full rounded-card"
            />
          </figure>
        )
      },
    },
    marks: {
      link: ({children, value}) => {
        const href = typeof value?.href === 'string' ? value.href : '#'
        const external = /^https?:\/\//.test(href)
        return (
          <a href={href} rel={external ? 'noopener noreferrer' : undefined} target={external ? '_blank' : undefined}>
            {children}
          </a>
        )
      },
    },
  }
}

export function RichTextRenderer({value, images}: {value: RichText; images: ImageUrlResolver}) {
  if (value.length === 0) return null
  return (
    <div className="prose-store">
      <PortableText value={value as PortableTextBlock[]} components={buildComponents(images)} />
    </div>
  )
}
