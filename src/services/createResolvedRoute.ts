import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { IS_RESOLVED_ROUTE_SYMBOL, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'
import { isRoute, Route } from '@/types/route'
import { Url } from '@/types/url'

/**
 * The alias url a route was matched through and the params that url parsed, which is what the resolved
 * route's `href` is built from instead of the route's own url.
 */
export type ResolvedRouteAlias = {
  url: Url,
  params: Record<string, unknown>,
}

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}, alias?: ResolvedRouteAlias): ResolvedRoute {
  const parts = {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  }
  const canonical = updateUrl(route.stringify(params), parts)
  const href = alias ? updateUrl(alias.url.stringify(alias.params), parts) : canonical
  const { query, hash } = parseUrl(href)
  const matched = route.matches.at(-1)

  if (!matched) {
    throw new Error('createResolvedRoute called with a route that has no matches')
  }

  async function getTitle(): Promise<string | undefined> {
    if (!isRoute(route)) {
      return undefined
    }

    return route.getTitle(resolvedRoute)
  }

  const resolvedRoute: ResolvedRoute & ResolvedRouteInternal = {
    ...route,
    [IS_RESOLVED_ROUTE_SYMBOL]: true,
    matched,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
    canonical,
    getTitle,
  }

  return resolvedRoute
}
