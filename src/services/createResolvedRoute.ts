import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { RouterResolveOptions } from '@/types/routerResolve'
import { getStateValues } from '@/services/state'
import { combineUrl } from '@/services/combineUrl'
import { parseUrl } from '@/services/urlParser'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const updatedRoute = combineUrl(route, {
    query: new URLSearchParams(options.query).toString(),
    hash: options.hash,
  })

  const href = updatedRoute.stringify(params)
  const { query, hash } = parseUrl(href)

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
