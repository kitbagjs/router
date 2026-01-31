import { parseUrl } from '@/services/urlParser'
import { assembleUrl } from '@/services/urlAssembly'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { getRouteParamValues } from '@/services/paramValidation'
import { RouterResolveOptions } from '@/types/routerResolve'
import { UrlString } from '@/types/urlString'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'

export function createResolvedRoute(route: Route, url: UrlString, options?: RouterResolveOptions): ResolvedRoute
export function createResolvedRoute(route: Route, params?: Record<string, unknown>, options?: RouterResolveOptions): ResolvedRoute
export function createResolvedRoute(route: Route, ulrOrParams: UrlString | Record<string, unknown> = {}, options: RouterResolveOptions = {}): ResolvedRoute {
  if (typeof ulrOrParams !== 'string') {
    const href = assembleUrl(route, {
      params: ulrOrParams,
      query: options.query,
      hash: options.hash,
    })

    return createResolvedRoute(route, href, options)
  }

  const href = ulrOrParams
  const params = getRouteParamValues(route, href)
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
