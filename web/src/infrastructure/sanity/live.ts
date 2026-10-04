import {defineLive} from 'next-sanity/live'

import {sanityReadToken} from '../config/env'
import {client} from './client'

export const {sanityFetch, SanityLive} = defineLive({
  client,
  serverToken: sanityReadToken ?? false,
  // Deliberately withheld from the browser. Draft previewing goes through
  // Presentation Tool, which renders drafts server-side.
  browserToken: false,
})
