import { Param } from '@/types/params'
import { ExtractRouterRouteParamTypes, RouterRoutes } from '@/types/routerRoute'
import { RoutesMap } from '@/types/routesMap'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouteWithParams<
  TRoutes extends RouterRoutes,
  TRoutePath extends string,
  TRouteMap extends RoutesMap = RoutesMap<TRoutes>
> = TRoutePath extends keyof TRouteMap ? {
  route: TRoutePath,
} & RouteParams<RouteParamsByName<TRoutes, TRoutePath>>
  : never

type RouteParams<T extends Record<string, unknown>> = AllPropertiesAreOptional<T> extends true ? { params?: T } : { params: T }

export type RouteGetByName<TRoutes extends RouterRoutes, TName extends keyof RoutesMap<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends RouterRoutes,
  TName extends string
> = ExtractRouterRouteParamTypes<RouteGetByName<TRoutes, TName>>

export type RouteWithParamsArgs<
  TRoutes extends RouterRoutes,
  TRouteName extends string,
  TRouteParams extends Record<string, Param> = RouteParamsByName<TRoutes, TRouteName>
> = [
  source: TRouteName,
  ...AllPropertiesAreOptional<TRouteParams> extends true ? [params?: TRouteParams] : [params: TRouteParams]
]