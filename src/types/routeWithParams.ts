import { ExtractRouterRouteParamTypes, RouterRoutes } from '@/types/routerRoute'
import { RoutesKey, RoutesMap } from '@/types/routesMap'

export type RouteGetByName<TRoutes extends RouterRoutes, TName extends RoutesKey<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends RouterRoutes,
  TName extends string
> = ExtractRouterRouteParamTypes<RouteGetByName<TRoutes, TName>>