import { ExtractRouteParamTypesWithOptional } from '@/types/params'
import { Routes } from '@/types/route'
import { RoutesName, RoutesMap } from '@/types/routesMap'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesName<TRoutes>> = RoutesMap<TRoutes>[TKey]

export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = ExtractRouteParamTypesWithOptional<RouteGetByKey<TRoutes, TKey>>
