import { GenericRoute, GenericRoutes } from '@/types/route'
import { RoutesName, RoutesMap } from '@/types/routesMap'
import { UrlParamsWriting } from '@/types/url'

export type RouteGetByKey<TRoutes extends GenericRoutes, TKey extends RoutesName<TRoutes>> = RoutesMap<TRoutes>[TKey]

// Intentionally distributive over TKey, much faster to resolve params while TKey is still being inferred
export type RouteParamsByKey<
  TRoutes extends GenericRoutes,
  TKey extends string
> = NoInfer<
  TKey extends string
    ? RouteGetByKey<TRoutes, TKey> extends GenericRoute
      ? UrlParamsWriting<RouteGetByKey<TRoutes, TKey>>
      : Record<string, unknown>
    : never
>
