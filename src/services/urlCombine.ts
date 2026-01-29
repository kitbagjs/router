import { UrlString } from '@/types/urlString'
import { parseUrl, stringifyUrl, UrlPartsInput } from '@/services/urlParser'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { stringHasValue } from '@/utilities/guards'

export function combineUrl(previous: UrlString | UrlPartsInput, updated: UrlString | UrlPartsInput): UrlString {
  const previousUrlParts = typeof previous === 'string' ? parseUrl(previous) : previous
  const updatedUrlParts = typeof updated === 'string' ? parseUrl(updated) : updated

  const previousQuery = previousUrlParts.query ?? new URLSearchParams(previousUrlParts.query)
  const updatedQuery = updatedUrlParts.query ?? new URLSearchParams(updatedUrlParts.query)

  return stringifyUrl({
    host: stringHasValue(updatedUrlParts.host) ? updatedUrlParts.host : previousUrlParts.host,
    path: stringHasValue(updatedUrlParts.path) ? updatedUrlParts.path : previousUrlParts.path,
    query: combineUrlSearchParams(updatedQuery, previousQuery),
    hash: stringHasValue(updatedUrlParts.hash) ? updatedUrlParts.hash : previousUrlParts.hash,
  })
}
