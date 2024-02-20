import { RouterRoute, RouteMethod, RouteMethodResponseImplementation, Routes } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

export type RouterFind<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>) => ResolvedRoute | undefined

export type RouterFindImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation) => ResolvedRoute | undefined

type CreateRouterFindContext = {
  routes: RouterRoute[],
  resolve: RouterResolveImplementation,
}

export function createRouterFind({ routes, resolve }: CreateRouterFindContext): RouterFindImplementation {
  return (source) => {
    const url = resolve(source)

    return getResolvedRouteForUrl(routes, url)
  }
}