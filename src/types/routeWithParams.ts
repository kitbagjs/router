import { ExtractRouteParamTypes, Routes } from '@/types/route'
import { RoutesKey, RoutesMap } from '@/types/routesMap'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesKey<TRoutes>> = RoutesMap<TRoutes>[TKey]
export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = ExtractRouteParamTypes<RouteGetByKey<TRoutes, TKey>>