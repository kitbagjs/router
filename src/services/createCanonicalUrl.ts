import { parseUrl, stringifyUrl } from '@/services/urlParser'
import { RouteAliasMatch } from '@/types/routeAlias'
import { isUrl, Url } from '@/types/url'
import { UrlString } from '@/types/urlString'

type CreateCanonicalUrlContext = {
  route: Url,
  params: Record<string, unknown>,
  alias?: RouteAliasMatch,
}

/**
 * Adds undeclared query values and a hash to the route's own url. Declared query keys (including
 * omitted optional params) and a declared hash belong to the route and cannot be replaced by extras.
 */
export function createCanonicalUrl(visitedUrl: UrlString, context: CreateCanonicalUrlContext): UrlString {
  const { route, params, alias } = context

  if (!isUrl(route)) {
    throw new Error('createCanonicalUrl called with an invalid url')
  }

  const url = route.stringify(params)

  if (!alias) {
    return visitedUrl
  }

  const visited = parseUrl(visitedUrl)
  const parts = parseUrl(url)
  const declaredQuery = new URLSearchParams(route.schema.query.value)

  for (const [key, value] of visited.query) {
    if (!declaredQuery.has(key)) {
      parts.query.append(key, value)
    }
  }

  if (!route.schema.hash.value) {
    parts.hash = visited.hash
  }

  return stringifyUrl(parts)
}
