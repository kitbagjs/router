import { ResolvedRoute } from '@/types/resolved'
import { RouterRoutes } from '@/types/routerRoute'
import { RoutesMap } from '@/types/routesMap'
import { RouteWithParamsArgs } from '@/types/routeWithParams'
import { Url } from '@/types/url'
import { resolve } from '@/utilities/createRouterResolve'
import { getResolvedRouteForUrl } from '@/utilities/getResolvedRouteForUrl'

export type RouterFind<TRoutes extends RouterRoutes> = {
  <TRouteKey extends keyof RoutesMap<TRoutes>>(source: TRouteKey, ...args: RouteWithParamsArgs<TRoutes, TRouteKey>): ResolvedRoute | undefined,
  (source: Url): ResolvedRoute | undefined,
}

export function createRouterFind<TRoutes extends RouterRoutes>(routes: TRoutes): RouterFind<TRoutes> {
  return (source: string, ...args: any[]) => find(routes, source, ...args)
}

export function find<TRoutes extends RouterRoutes, TRouteKey extends string>(routes: TRoutes, source: TRouteKey, ...args: RouteWithParamsArgs<TRoutes, TRouteKey>): ResolvedRoute | undefined
export function find(routes: RouterRoutes, source: Url): ResolvedRoute | undefined
export function find(routes: RouterRoutes, source: string, maybeParams?: Record<string, unknown>): ResolvedRoute | undefined
export function find(routes: RouterRoutes, source: string, maybeParams?: Record<string, unknown>): ResolvedRoute | undefined {
  const url = resolve(routes, source, maybeParams)

  return getResolvedRouteForUrl(routes, url)
}