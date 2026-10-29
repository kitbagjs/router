import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { parseUrl, updateUrl } from '@/services/urlParser'
import { isResolvedRoute, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'
import { RouterResolveOptions } from '@/types/routerResolve'

/**
 * Applies query, hash, and state to an already resolved route the same way a push with those options
 * changes the url. Query values are appended, hash and state values override.
 */
export function updateResolvedRoute(route: ResolvedRoute, options: RouterResolveOptions): ResolvedRoute {
  if (!isResolvedRoute(route)) {
    throw new Error('updateResolvedRoute called with a value that is not a resolved route')
  }

  const href = updateUrl(route.href, {
    query: options.query,
    hash: options.hash,
  })
  const { query, hash } = parseUrl(href)

  const updated: ResolvedRoute & ResolvedRouteInternal = {
    ...route,
    href,
    query: createResolvedRouteQuery(query),
    hash,
    state: { ...route.state, ...options.state },
    getTitle: () => route.getRouteTitle(updated),
  }

  return updated
}
