import { Url, UrlParts } from '@/types/url'
import { parseUrl } from '@/services/urlParser'
import { createUrl } from '@/services/urlCreator'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { stringHasValue } from '@/utilities'

export function combineUrl(previous: Url | Partial<UrlParts>, updated: Url | Partial<UrlParts>): Url {
  const previousUrlParts = typeof previous === 'string' ? parseUrl(previous) : previous
  const updatedUrlParts = typeof updated === 'string' ? parseUrl(updated) : updated

  const previousParams = previousUrlParts.searchParams ?? new URLSearchParams(previousUrlParts.search)
  const updatedParams = updatedUrlParts.searchParams ?? new URLSearchParams(updatedUrlParts.search)

  return createUrl({
    protocol: stringHasValue(updatedUrlParts.protocol) ? updatedUrlParts.protocol : previousUrlParts.protocol,
    host: stringHasValue(updatedUrlParts.host) ? updatedUrlParts.host : previousUrlParts.host,
    pathname: stringHasValue(updatedUrlParts.pathname) ? updatedUrlParts.pathname : previousUrlParts.pathname,
    searchParams: combineUrlSearchParams(updatedParams, previousParams),
    hash: stringHasValue(updatedUrlParts.hash) ? updatedUrlParts.hash : previousUrlParts.hash,
  })
}
