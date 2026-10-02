import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByName } from '@/types/state'
import { UrlString } from '@/types/urlString'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/querySource'
import { ResolvedRoute } from '@/types/resolved'

export type RouterPushOptions<
  TState = unknown
> = {
  /**
   * The query string to add to the url.
   */
  query?: QuerySource,
  /**
   * The hash to append to the url.
   */
  hash?: string,
  /**
   * Whether to replace the current history entry.
   */
  replace?: boolean,
  /**
   * State values to pass to the route.
   */
  state?: Partial<TState>,
}

type RouterPushArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterPushOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterPushOptions<RouteStateByName<TRoutes, TSource>>]

/**
 * Navigates to a route. In native browser mode, the promise includes route data, rendering and
 * the browser's scroll and focus behavior. Canceled navigations resolve;
 * cancellation before commit preserves the current entry.
 */
export type RouterPush<
  TRoutes extends Routes = any
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterPushArgs<TRoutes, TSource>): Promise<void>,
  (route: ResolvedRoute, options?: RouterPushOptions): Promise<void>,
  (url: UrlString, options?: RouterPushOptions): Promise<void>,
}
