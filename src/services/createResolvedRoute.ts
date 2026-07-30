import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ResolvedRoute } from '@/types/resolved'
import { isRoute, Route } from '@/types/route'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const routeUrl = route.stringify(params)
  const href = updateUrl(routeUrl, {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  })
  const { query, hash } = parseUrl(href)
  const { promise: title, resolve: resolveTitle } = Promise.withResolvers<string | undefined>()
  const matched = route.matches.at(-1)

  if (!matched) {
    throw new Error('createResolvedRoute called with a route that has no matches')
  }

  const resolvedRoute = {
    ...route,
    matched,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
    title,
  } satisfies ResolvedRoute

  getRouteTitle(resolvedRoute).then(resolveTitle)

  return resolvedRoute
}

async function getRouteTitle(route: ResolvedRoute): Promise<string | undefined> {
  if (isRoute(route)) {
    return route.getTitle(route)
  }

  return undefined
}
