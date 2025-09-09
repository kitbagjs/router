import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { parseUrl } from '@/services/urlParser'
import { assembleUrl } from '@/services/urlAssembly'
import { RouterResolveOptions } from '@/types/routerResolve'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { getRouteParamValues } from './paramValidation'

export function createResolvedRoute(route: Route, params: Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  const href = assembleUrl(route, {
    params: params,
    query: options.query,
    hash: options.hash,
  })

  const { search, hash } = parseUrl(href)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query: createResolvedRouteQuery(search),
    params: getRouteParamValues(route, href),
    state: getStateValues(route.state, options.state),
    hash,
    href,
  }
}
