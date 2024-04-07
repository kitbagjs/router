import { ResolvedRoute } from '@/types/resolved'
import { RouterRoutes } from '@/types/routerRoute'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

export type RouterFind<
  TRoutes extends RouterRoutes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>) => ResolvedRoute | undefined

export type RouterFindImplementation = (source: string | RouteWithParamsImplementation) => ResolvedRoute | undefined

type CreateRouterFindContext = {
  routes: RouterRoutes,
  resolve: RouterResolveImplementation,
}

export function createRouterFind({ routes, resolve }: CreateRouterFindContext): RouterFindImplementation {
  return (source) => {
    const url = resolve(source)

    return getResolvedRouteForUrl(routes, url)
  }
}