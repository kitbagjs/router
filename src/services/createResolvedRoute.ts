import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { RouterResolveOptions } from '@/types/routerResolve'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { createUrl } from '@/services/createUrl'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const updatedRoute = createUrl({
    host: route.host.toString(params),
    path: route.path.toString(params),
    query: combineUrlSearchParams(route.query.toString(params), options.query).toString(),
    hash: route.hash.value ? route.hash.toString(params) : options.hash,
  })

  const query = createResolvedRouteQuery(updatedRoute.query.toString(params))
  const href = updatedRoute.toString()
  const hash = updatedRoute.hash.toString()

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    hooks: route.hooks,
    params: route.parse(href),
    state: getStateValues(route.state, options.state),
    query,
    hash,
    href,
  }
}
