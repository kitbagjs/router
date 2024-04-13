import { ResolvedRoute } from '@/types/resolved'
import { RouterRoutes } from '@/types/routerRoute'
import { RouteWithParams } from '@/types/routeWithParams'
import { RouterResolve } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

export type RouterFind<
  TRoutes extends RouterRoutes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>) => ResolvedRoute | undefined

type CreateRouterFindContext<T extends RouterRoutes> = {
  routes: T,
  resolve: RouterResolve<T>,
}

export function createRouterFind<const T extends RouterRoutes>({ routes, resolve }: CreateRouterFindContext<T>): RouterFind<T> {
  return (source) => {
    const url = resolve(source)

    return getResolvedRouteForUrl(routes, url)
  }
}