import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ResolvedRoute } from '@/types/resolved'
import { isRoute, Route } from '@/types/route'
import { RouteAliasMatch } from '@/types/routeAlias'

type CreateResolvedRouteOptions = RouterResolveOptions & {
  /**
   * The alias the route was matched through, which is what `href` is built from instead of the route's
   * own url.
   */
  alias?: RouteAliasMatch,
}

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: CreateResolvedRouteOptions = {}): ResolvedRoute {
  const { alias } = options
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

  const resolvedRoute: ResolvedRoute = {
    ...route,
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
