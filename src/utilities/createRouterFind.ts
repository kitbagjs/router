import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/routerRoute'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByName } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { createRouterResolve } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

type RouterFindArgs<
  TRoutes extends Routes,
  TSource extends string & keyof RoutesKey<TRoutes>,
  TParams = RouteParamsByName<TRoutes, TSource>
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

  return <TRoutes extends Routes, TSource extends Url | RoutesKey<TRoutes>>(
    source: TSource,
    params: Record<PropertyKey, unknown> = {},
  ): ResolvedRoute | undefined => {
    const resolve = createRouterResolve(routes)
    const url = resolve(source, params)

    return getResolvedRouteForUrl(routes, url)
  }

}