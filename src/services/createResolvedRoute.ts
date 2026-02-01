import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const routeUrl = route.stringify(params)
  const href = updateUrl(routeUrl, {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  })
  const { query, hash } = parseUrl(href)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    hooks: route.hooks,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
  }
}
