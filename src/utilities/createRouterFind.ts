import { ResolvedRoute, RouteMethod, RouteMethodResponseImplementation, Routes } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { RouterResolveImplementation } from '@/utilities/createRouterResolve'
import { routeMatch } from '@/utilities/routeMatch'

export type RouterFind<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>) => ResolvedRoute | undefined

export type RouterFindImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation) => ResolvedRoute | undefined

type CreateRouterFindContext = {
  resolved: ResolvedRoute[],
  resolve: RouterResolveImplementation,
}

export function createRouterFind({ resolved, resolve }: CreateRouterFindContext): RouterFindImplementation {
  return (source) => {
    const url = resolve(source)

    return routeMatch(resolved, url)
  }
}