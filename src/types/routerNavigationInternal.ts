import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RedirectStatus } from '@/types/router'
import { RouterPush, RouterPushOptions } from '@/types/routerPush'
import { RouterReplace, RouterReplaceOptions } from '@/types/routerReplace'
import { RouteParamsByKey } from '@/types/routeWithParams'
import { RoutesName } from '@/types/routesMap'
import { RouteStateByName } from '@/types/state'
import { UrlString } from '@/types/urlString'

/**
 * Push and replace as the router itself calls them, which may carry the status a server responds with for
 * the redirect. The router exposes {@link RouterPush} and {@link RouterReplace} instead.
 */
export type RouterPushOptionsInternal<
  TState = unknown
> = RouterPushOptions<TState> & {
  redirectStatus?: RedirectStatus,
}

export type RouterReplaceOptionsInternal<
  TState = unknown
> = RouterReplaceOptions<TState> & {
  redirectStatus?: RedirectStatus,
}

export type RouterPushInternal<
  TRoutes extends Routes
> = RouterPush<TRoutes> & {
  <TSource extends RoutesName<TRoutes>>(name: TSource, params: RouteParamsByKey<TRoutes, TSource> | undefined, options: RouterPushOptionsInternal<RouteStateByName<TRoutes, TSource>>): Promise<void>,
  (route: ResolvedRoute, options: RouterPushOptionsInternal): Promise<void>,
  (url: UrlString, options: RouterPushOptionsInternal): Promise<void>,
}

export type RouterReplaceInternal<
  TRoutes extends Routes
> = RouterReplace<TRoutes> & {
  <TSource extends RoutesName<TRoutes>>(name: TSource, params: RouteParamsByKey<TRoutes, TSource> | undefined, options: RouterReplaceOptionsInternal<RouteStateByName<TRoutes, TSource>>): Promise<void>,
  (route: ResolvedRoute, options: RouterReplaceOptionsInternal): Promise<void>,
  (url: UrlString, options: RouterReplaceOptionsInternal): Promise<void>,
}
