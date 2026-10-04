import {createImageUrlBuilder} from '@sanity/image-url'

import type {ImageRef} from '@/core/domain/image'
import type {ImageTransform, ImageUrlResolver} from '@/core/ports/image-url-resolver'

import {sanityConfig} from '../config/env'

const builder = createImageUrlBuilder({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
})

/**
 * Turns a domain image reference into a Sanity CDN URL.
 *
 * Every request names a width so the CDN returns a right-sized file instead
 * of the original upload, and `auto('format')` lets it serve WebP or AVIF to
 * browsers that accept them.
 */
export function createSanityImageUrlResolver(): ImageUrlResolver {
  return {
    resolve(image: ImageRef, transform: ImageTransform): string {
      let url = builder.image(image.assetId).width(transform.width).auto('format')

      if (transform.height !== undefined) {
        url = url.height(transform.height).fit('crop')

        // Crop toward the editor's chosen focal point rather than the centre.
        if (image.focalPoint) {
          url = url.crop('focalpoint').focalPoint(image.focalPoint.x, image.focalPoint.y)
        }
      } else {
        url = url.fit('max')
      }

      return url.url()
    },
  }
}
