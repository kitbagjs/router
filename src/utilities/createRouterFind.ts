import { ResolvedRoute } from '@/types/resolved'
import { RouterRoutes } from '@/types/routerRoute'
import { RoutesKey } from '@/types/routesMap'
import { RouteKeysThatHaveOptionalParams, RouteKeysThatHaveRequireParams, RouteParamsByName } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

export type RouterFind<
  TRoutes extends RouterRoutes
> = {
  <TSource extends RouteKeysThatHaveRequireParams<TRoutes>>(source: TSource, params: RouteParamsByName<TRoutes, TSource>): ResolvedRoute | undefined,
  <TSource extends RouteKeysThatHaveOptionalParams<TRoutes>>(source: TSource, params?: RouteParamsByName<TRoutes, TSource>): ResolvedRoute | undefined,
  (source: Url): ResolvedRoute | undefined,
}

export function createRouterFind<const TRoutes extends RouterRoutes>(routes: TRoutes): RouterFind<TRoutes> {
  function find<TSource extends RouteKeysThatHaveRequireParams<TRoutes>>(
    source: TSource,
    params: RouteParamsByName<TRoutes, TSource>
  ): ResolvedRoute | undefined
  function find<TSource extends RouteKeysThatHaveOptionalParams<TRoutes>>(
    source: TSource,
    params?: RouteParamsByName<TRoutes, TSource>
  ): ResolvedRoute | undefined
  function find(
    source: Url
  ): ResolvedRoute | undefined
  function find<TRoutes extends RouterRoutes, TSource extends Url | RoutesKey<TRoutes>>(
    source: TSource,
    params: Record<PropertyKey, unknown> = {},
  ): ResolvedRoute | undefined {
    const resolve = createRouterResolve(routes)
    const url = resolve(source, params)

    return getResolvedRouteForUrl(routes, url)
  }

  return find
}