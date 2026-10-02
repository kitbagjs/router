import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByName } from '@/types/state'
import { UrlString } from '@/types/urlString'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/querySource'
import { ResolvedRoute } from '@/types/resolved'

export type RouterReplaceOptions<
  TState = unknown
> = {
  query?: QuerySource,
  hash?: string,
  state?: Partial<TState>,
}

type RouterReplaceArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterReplaceOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterReplaceOptions<RouteStateByName<TRoutes, TSource>>]

/**
 * Replaces the current entry. In native browser mode, the promise includes route data, rendering
 * and the browser's scroll and focus behavior. Canceled navigations resolve;
 * cancellation before commit preserves the current entry.
 */
export type RouterReplace<
  TRoutes extends Routes
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterReplaceArgs<TRoutes, TSource>): Promise<void>,
  (route: ResolvedRoute, options?: RouterReplaceOptions): Promise<void>,
  (url: UrlString, options?: RouterReplaceOptions): Promise<void>,
}
