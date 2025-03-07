import { ExtractRouteParamTypesWriting } from '@/types/params'
import { Route, Routes } from '@/types/route'
import { RoutesName, RoutesMap } from '@/types/routesMap'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesName<TRoutes>> = RoutesMap<TRoutes>[TKey]

export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = RouteGetByKey<TRoutes, TKey> extends Route
  ? ExtractRouteParamTypesWriting<RouteGetByKey<TRoutes, TKey>>
  : Record<string, unknown>
