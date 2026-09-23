import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { IS_RESOLVED_ROUTE_SYMBOL, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'
import { getHooks } from '@/types/hooks'
import { RouterResolveOptions } from '@/types/routerResolve'

/**
 * Applies query, hash, and state to an already resolved route the same way a push with those options
 * changes the url. Query values are appended, hash and state values override.
 */
export function updateResolvedRoute(route: ResolvedRoute, options: RouterResolveOptions): ResolvedRoute {
  const href = updateUrl(route.href, {
    query: options.query,
    hash: options.hash,
  })
  const { query, hash } = parseUrl(href)

  const updated: ResolvedRoute & ResolvedRouteInternal = {
    ...route,
    [IS_RESOLVED_ROUTE_SYMBOL]: true,
    hooks: getHooks(route),
    href,
    query: createResolvedRouteQuery(query),
    hash,
    state: { ...route.state, ...options.state },
  }

  return updated
}
