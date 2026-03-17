import { parseUrl, updateUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { RouterResolveOptions } from '@/types/routerResolve'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { isRouteWithTitleGetter } from '@/types/titles'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const routeUrl = route.stringify(params)
  const href = updateUrl(routeUrl, {
    query: new URLSearchParams(options.query),
    hash: options.hash,
  })
  const { query, hash } = parseUrl(href)

  const resolvedRoute = {
    ...route,
    query: createResolvedRouteQuery(query),
    state: getStateValues(route.state, options.state),
    hash,
    params,
    href,
    title: Promise.resolve(undefined),
  }

  return {
    ...resolvedRoute,
    title: new Promise<string | undefined>((resolve) => {
      if (isRouteWithTitleGetter(route)) {
        resolve(route.getTitle(resolvedRoute))
      }

      resolve(undefined)
    }),
  }
}
