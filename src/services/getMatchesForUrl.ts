import { createResolvedRoute } from '@/services/createResolvedRoute'
import { parseUrl } from '@/services/urlParser'
import { filterQueryParams } from '@/services/queryParamFilter'
import { ResolvedRoute } from '@/types/resolved'
import { isRoute, Route, RouteInternal, Routes } from '@/types/route'
import { RouteAlias } from '@/types/routeAlias'
import { ParseUrlOptions } from '@/types/url'
import { isNamedRoute } from '@/utilities/isNamedRoute'

type MatchOptions = { state?: Partial<unknown> } & ParseUrlOptions

/**
 * Every route's own url is tried before any alias, so an alias never outranks another route's own url
 * regardless of the order the routes were defined in.
 */
export function getMatchForUrl(routes: Routes, url: string, options: MatchOptions = {}): ResolvedRoute | undefined {
  const namedRoutes = routes.filter(isNamedRoute)

  for (const route of namedRoutes) {
    const { success, params } = route.tryParse(url, options)

    if (success) {
      return createResolvedRoute(route, params, {
        ...options,
        ...getExtras(url, route.stringify(params)),
      })
    }
  }

  for (const route of namedRoutes) {
    if (!isRoute(route)) {
      continue
    }

    for (const alias of route.aliases) {
      const match = getMatchForAlias(route, alias, url, options)

      if (match) {
        return match
      }
    }
  }
}

/**
 * The transformed params take the same path any params take when navigating to the route by name: they
 * are written into the route's own url and parsed back out of it. Params the route cannot write, or read
 * back, mean the alias does not match, the same as a url whose params fail parsing.
 */
function getMatchForAlias(route: Route & RouteInternal, alias: RouteAlias, url: string, options: MatchOptions): ResolvedRoute | undefined {
  const aliasMatch = alias.url.tryParse(url, options)

  if (!aliasMatch.success) {
    return undefined
  }

  const canonicalUrl = tryStringify(route, alias.transform(url, aliasMatch.params))

  if (canonicalUrl === undefined) {
    return undefined
  }

  const { success, params } = route.tryParse(canonicalUrl)

  if (!success) {
    return undefined
  }

  const extras = getExtras(url, alias.url.stringify(aliasMatch.params))

  return createResolvedRoute(route, params, {
    ...options,
    ...extras,
    alias: { url: alias.url, params: aliasMatch.params },
  })
}

function tryStringify(route: Route, params: Record<string, unknown>): string | undefined {
  try {
    return route.stringify(params)
  } catch {
    return undefined
  }
}

/**
 * The parts of the url the route did not declare: the query with the route's own params removed, and the
 * hash.
 */
function getExtras(url: string, matchedUrl: string): { query: URLSearchParams, hash: string } {
  const { query, hash } = parseUrl(url)
  const { query: matchedQuery } = parseUrl(matchedUrl)

  return {
    query: filterQueryParams(query, matchedQuery),
    hash,
  }
}
