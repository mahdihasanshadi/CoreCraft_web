/**
 * An opaque rich-text document.
 *
 * The domain carries rich text around but never inspects its shape. Only the
 * presentation layer knows how to render it, and only the infrastructure layer
 * knows what the content store returns. That keeps the editorial format a
 * detail rather than a domain concept.
 */
export type RichText = readonly unknown[]

export function isEmptyRichText(value: RichText | null | undefined): boolean {
  return !Array.isArray(value) || value.length === 0
}
