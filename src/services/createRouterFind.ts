import { createRouterResolve } from '@/services/createRouterResolve'
import { getResolvedRouteForUrl } from '@/services/getResolvedRouteForUrl'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { ResolvedRoute } from '@/types/resolved'
import { Route, Routes } from '@/types/route'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

type RouterFindArgs<
  TRoutes extends Routes,
  TSource extends RoutesKey<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams]
  : [params: TParams]

export type RouterFind<
  TRoutes extends Routes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterFindArgs<TRoutes, TSource>): ResolvedRoute | undefined,
  (source: Url): ResolvedRoute | undefined,
}

export function createRouterFind<const TRoutes extends Routes>(routes: TRoutes): RouterFind<TRoutes> {

  return <TRoutes extends Routes, TSource extends RoutesKey<TRoutes>>(
    source: TSource,
    params: Record<PropertyKey, unknown> = {},
  ): ResolvedRoute | undefined => {
    const resolve = createRouterResolve(routes as Route<string, Path, Query, false>[])
    const url = resolve(source, params)

    return getResolvedRouteForUrl(routes, url)
  }

}