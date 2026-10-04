import 'server-only'

import {createClient, type SanityClient} from 'next-sanity'

import {WriteAccessUnavailableError} from '@/core/domain/errors'

import {sanityConfig, sanityWriteToken} from '../config/env'

let cached: SanityClient | null = null

/**
 * A token-bearing client for the private commerce dataset.
 *
 * Built lazily so a missing token fails the one request that needed it with
 * a clear domain error, rather than crashing every page at import time. The
 * CDN is bypassed because this client both writes and immediately reads back.
 */
export function commerceClient(): SanityClient {
  if (cached) return cached
  if (!sanityWriteToken) throw new WriteAccessUnavailableError()

  cached = createClient({
    projectId: sanityConfig.projectId,
    dataset: sanityConfig.commerceDataset,
    apiVersion: sanityConfig.apiVersion,
    token: sanityWriteToken,
    useCdn: false,
    perspective: 'published',
  })
  return cached
}
