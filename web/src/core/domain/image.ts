/**
 * A point of interest in an image, expressed as fractions of width and height.
 * Lets a renderer crop to any aspect ratio without cutting off the subject.
 */
export interface FocalPoint {
  readonly x: number
  readonly y: number
}

/**
 * A reference to an image held in whatever asset store the infrastructure
 * layer talks to. The domain knows the asset has an identity and a
 * description, and nothing about URLs or transformation parameters.
 */
export interface ImageRef {
  readonly assetId: string
  readonly alt: string | null
  readonly focalPoint: FocalPoint | null
}

export function createImageRef(
  assetId: string,
  alt: string | null = null,
  focalPoint: FocalPoint | null = null,
): ImageRef {
  if (!assetId) {
    throw new TypeError('An image reference needs a non-empty asset id')
  }
  return {assetId, alt, focalPoint}
}
