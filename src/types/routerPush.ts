import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByName } from '@/types/state'
import { Url } from '@/types/url'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/query'
import { ResolvedRoute } from '@/types/resolved'

export type RouterPushOptions<
  TState = unknown
> = {
  query?: QuerySource,
  hash?: string,
  replace?: boolean,
  state?: Partial<TState>,
}

type RouterPushArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterPushOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterPushOptions<RouteStateByName<TRoutes, TSource>>]

export type RouterPush<
  TRoutes extends Routes = any
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterPushArgs<TRoutes, TSource>): Promise<void>,
  (url: Url, options?: RouterPushOptions): Promise<void>,
  (route: ResolvedRoute, options?: RouterPushOptions): Promise<void>,
}
