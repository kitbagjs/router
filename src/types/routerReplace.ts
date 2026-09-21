import { Routes } from '@/types/route'
import { RoutesName } from '@/types/routesMap'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RouteStateByName } from '@/types/state'
import { UrlString } from '@/types/urlString'
import { AllPropertiesAreOptional } from '@/types/utilities'
import { QuerySource } from '@/types/querySource'
import { ResolvedRoute } from '@/types/resolved'
import { RedirectStatus } from '@/types/router'

export type RouterReplaceOptions<
  TState = unknown
> = {
  query?: QuerySource,
  hash?: string,
  state?: Partial<TState>,
}

/**
 * Options as the router itself replaces with, which may carry the status a server responds with for
 * the replace. The router exposes {@link RouterReplaceOptions} instead.
 */
export type RouterReplaceOptionsInternal<
  TState = unknown
> = RouterReplaceOptions<TState> & {
  redirectStatus?: RedirectStatus,
}

type RouterReplaceArgs<
  TRoutes extends Routes,
  TSource extends RoutesName<TRoutes>
> = AllPropertiesAreOptional<RouteParamsByKey<TRoutes, TSource>> extends true
  ? [params?: RouteParamsByKey<TRoutes, TSource>, options?: RouterReplaceOptions<RouteStateByName<TRoutes, TSource>>]
  : [params: RouteParamsByKey<TRoutes, TSource>, options?: RouterReplaceOptions<RouteStateByName<TRoutes, TSource>>]

export type RouterReplace<
  TRoutes extends Routes
> = {
  <TSource extends RoutesName<TRoutes>>(name: TSource, ...args: RouterReplaceArgs<TRoutes, TSource>): Promise<void>,
  (route: ResolvedRoute, options?: RouterReplaceOptions): Promise<void>,
  (url: UrlString, options?: RouterReplaceOptions): Promise<void>,
}

/**
 * Replace as the router itself calls it, which may carry the status a server responds with. The router
 * exposes {@link RouterReplace} instead.
 */
export type RouterReplaceInternal<
  TRoutes extends Routes
> = RouterReplace<TRoutes> & {
  <TSource extends RoutesName<TRoutes>>(name: TSource, params: RouteParamsByKey<TRoutes, TSource> | undefined, options: RouterReplaceOptionsInternal<RouteStateByName<TRoutes, TSource>>): Promise<void>,
  (route: ResolvedRoute, options: RouterReplaceOptionsInternal): Promise<void>,
  (url: UrlString, options: RouterReplaceOptionsInternal): Promise<void>,
}
