import { ExtractRouteParamTypes, Routes } from '@/types/routerRoute'
import { RoutesKey, RoutesMap } from '@/types/routesMap'

export type RouteGetByName<TRoutes extends Routes, TName extends RoutesKey<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends Routes,
  TName extends string
> = ExtractRouteParamTypes<RouteGetByName<TRoutes, TName>>