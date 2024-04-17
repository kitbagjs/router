import { ExtractRouterRouteParamTypes, RouterRoutes } from '@/types/routerRoute'
import { RoutesKey, RoutesMap } from '@/types/routesMap'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouteGetByName<TRoutes extends RouterRoutes, TName extends RoutesKey<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends RouterRoutes,
  TName extends string
> = ExtractRouterRouteParamTypes<RouteGetByName<TRoutes, TName>>

export type RouteKeysThatHaveOptionalParams<TRoutes extends RouterRoutes> = {
  [K in RoutesKey<TRoutes> as AllPropertiesAreOptional<RouteParamsByName<TRoutes, K>> extends true ? K : never]: K
}[keyof {
  [K in RoutesKey<TRoutes> as AllPropertiesAreOptional<RouteParamsByName<TRoutes, K>> extends true ? K : never]: K
}]

export type RouteKeysThatHaveRequireParams<TRoutes extends RouterRoutes> = {
  [K in RoutesKey<TRoutes> as AllPropertiesAreOptional<RouteParamsByName<TRoutes, K>> extends true ? never : K]: K
}[keyof {
  [K in RoutesKey<TRoutes> as AllPropertiesAreOptional<RouteParamsByName<TRoutes, K>> extends true ? never : K]: K
}]