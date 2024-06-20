import { createRouterResolve } from '@/services/createRouterResolve'
import { getResolvedRouteForUrl } from '@/services/getResolvedRouteForUrl'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { isUrl, Url } from '@/types/url'
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

  return <TSource extends RoutesKey<TRoutes>>(
    source: Url | TSource,
    params: Record<PropertyKey, unknown> = {},
  ): ResolvedRoute | undefined => {
    const resolve = createRouterResolve(routes)

    if (isUrl(source)) {
      const url = resolve(source)

      return getResolvedRouteForUrl(routes, url)
    }

    const url = resolve(source, params as RouteParamsByKey<TRoutes, TSource>)

    return getResolvedRouteForUrl(routes, url)
  }

}