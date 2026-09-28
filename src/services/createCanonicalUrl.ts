import { parseUrl, stringifyUrl } from '@/services/urlParser'
import { QuerySource } from '@/types/querySource'
import { isUrl, Url } from '@/types/url'
import { UrlString } from '@/types/urlString'

type UrlExtras = {
  query?: QuerySource,
  hash?: string,
}

/**
 * Adds undeclared query values and a hash to the route's own url. Declared query keys (including
 * omitted optional params) and a declared hash belong to the route and cannot be replaced by extras.
 */
export function createCanonicalUrl(route: Url, params: Record<string, unknown>, extras: UrlExtras): UrlString {
  if (!isUrl(route)) {
    throw new Error('createCanonicalUrl called with an invalid url')
  }

  const parts = parseUrl(route.stringify(params))
  const declaredQuery = new URLSearchParams(route.schema.query.value)

  for (const [key, value] of new URLSearchParams(extras.query)) {
    if (!declaredQuery.has(key)) {
      parts.query.append(key, value)
    }
  }

  if (!route.schema.hash.value) {
    parts.hash = extras.hash ?? parts.hash
  }

  return stringifyUrl(parts)
}
