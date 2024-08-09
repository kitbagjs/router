import { Routes } from '@/types/route'
import { RoutesKey } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByKey } from '@/types/state'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouterPushOptions<
  TState = unknown
> = {
  query?: Record<string, string>,
  replace?: boolean,
  state?: Partial<TState>,
}

type RouterPushArgs<
  TRoutes extends Routes,
  TSource extends RoutesKey<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterPushOptions<RouteStateByKey<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterPushOptions<RouteStateByKey<TRoutes, TSource>>]

export type RouterPush<
  TRoutes extends Routes = any
> = {
  <TSource extends RoutesKey<TRoutes>>(source: TSource, ...args: RouterPushArgs<TRoutes, TSource>): Promise<void>,
  (source: Url, options?: RouterPushOptions): Promise<void>,
}