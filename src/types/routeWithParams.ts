import { Route, Routes } from '@/types/route'
import { RoutesName, RoutesMap } from '@/types/routesMap'
import { UrlParamsWriting } from '@/types/url'

export type RouteGetByKey<TRoutes extends Routes, TKey extends RoutesName<TRoutes>> = RoutesMap<TRoutes>[TKey]

/**
 * Distributes over `TKey` so that while a route name is still being inferred (e.g. contextually typing the
 * params of `router.push(name, params)`), TypeScript resolves the params through this type's cached
 * constraint instead of re-instantiating the generic mapped types behind `UrlParamsWriting` on every call.
 */
export type RouteParamsByKey<
  TRoutes extends Routes,
  TKey extends string
> = TKey extends string
  ? RouteGetByKey<TRoutes, TKey> extends Route
    ? UrlParamsWriting<RouteGetByKey<TRoutes, TKey>>
    : Record<string, unknown>
  : never
