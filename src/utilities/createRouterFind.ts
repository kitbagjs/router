import { RouterRoute } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

export type RouterFind<
  TRoutes extends RouterRoute[]
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>) => ResolvedRoute | undefined

export type RouterFindImplementation = (source: string | RouteWithParamsImplementation) => ResolvedRoute | undefined

type CreateRouterFindContext = {
  routes: Readonly<RouterRoute[]>,
  resolve: RouterResolveImplementation,
}

export function createRouterFind({ routes, resolve }: CreateRouterFindContext): RouterFindImplementation {
  return (source) => {
    const url = resolve(source)

    return getResolvedRouteForUrl(routes, url)
  }
}