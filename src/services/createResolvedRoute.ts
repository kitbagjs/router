import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { IS_RESOLVED_ROUTE_SYMBOL, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'
import { isRoute, Route } from '@/types/route'
import { getHooks } from '@/types/hooks'
import { GetRouteTitle } from '@/types/routeTitle'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const routeUrl = route.stringify(params)
  const href = updateUrl(routeUrl, {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  })
  const { query, hash } = parseUrl(href)
  const matched = route.matches.at(-1)

  if (!matched) {
    throw new Error('createResolvedRoute called with a route that has no matches')
  }

  const getRouteTitle: GetRouteTitle = isRoute(route) ? route.getTitle : async () => undefined

  const resolvedRoute: ResolvedRoute & ResolvedRouteInternal = {
    [IS_RESOLVED_ROUTE_SYMBOL]: true,
    id: route.id,
    name: route.name,
    matches: route.matches,
    hooks: getHooks(route),
    getRouteTitle,
    matched,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
    getTitle: () => getRouteTitle(resolvedRoute),
  }

  return resolvedRoute
}
