import type {ImageRef} from '../domain/image'

/** What a caller wants back, not how to get it. */
export interface ImageTransform {
  readonly width: number
  readonly height?: number
}

/**
 * Turns a domain image reference into something an `<img>` can load.
 *
 * Declared as a port because building CDN URLs is an infrastructure detail,
 * while deciding what size an image should be is a presentation one. Neither
 * belongs in the domain, and the domain should not be imported by either.
 */
export interface ImageUrlResolver {
  resolve(image: ImageRef, transform: ImageTransform): string
}
