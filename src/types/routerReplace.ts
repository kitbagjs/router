import { Routes } from '@/types/route'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByKey } from '@/types/state'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterReplaceOptions<
  TState = unknown
> = {
  query?: Record<string, string>,
  state?: Partial<TState>,
}

type RouterReplaceArgs<
  TRoutes extends Routes,
  TSource extends RoutesKey<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterReplaceOptions<RouteStateByKey<TRoutes, TSource>>]
  : [params: TParams, options?: RouterReplaceOptions<RouteStateByKey<TRoutes, TSource>>]

export type RouterReplace<
  TRoutes extends Routes
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterReplaceArgs<TRoutes, TSource>): Promise<void>,
  (source: Url, options?: RouterReplaceOptions): Promise<void>,
}
