import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByName } from '@/types/state'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterReplaceOptions<
  TState = unknown
> = {
  query?: Record<string, string>,
  hash?: string,
  state?: Partial<TState>,
}

type RouterReplaceArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>,
  TParams = RouteParamsByKey<TRoutes, TSource>
> = AllPropertiesAreOptional<TParams> extends true
  ? [params?: TParams, options?: RouterReplaceOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: TParams, options?: RouterReplaceOptions<RouteStateByName<TRoutes, TSource>>]

export type RouterReplace<
  TRoutes extends Routes
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterReplaceArgs<TRoutes, TSource>): Promise<void>,
  (url: Url, options?: RouterReplaceOptions): Promise<void>,
}
