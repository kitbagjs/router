import { ResolvedRoute, RouteMethod, RouteMethodResponseImplementation, Routes } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { RouterRoute } from '@/utilities/createRouterRoute'
import { getRouterRouteForUrl } from '@/utilities/routes'

export type RouterFind<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>) => RouterRoute | undefined

export type RouterFindImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation) => RouterRoute | undefined

type CreateRouterFindContext = {
  resolved: ResolvedRoute[],
  resolve: RouterResolveImplementation,
}

export function createRouterFind({ resolved, resolve }: CreateRouterFindContext): RouterFindImplementation {
  return (source) => {
    const url = resolve(source)

    return getRouterRouteForUrl(resolved, url)
  }
}