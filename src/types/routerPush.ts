import { RouterRoutes } from '@/types/routerRoute'
import { RoutesMap } from '@/types/routesMap'
import { RouteWithParamsArgs } from '@/types/routeWithParams'
import { Url } from '@/types/url'

export type RouterPushOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type PushRouteWithParamsArgs<TRoutes extends RouterRoutes, TRouteKey extends string> = [...RouteWithParamsArgs<TRoutes, TRouteKey>, options?: RouterPushOptions | undefined]

export type RouterPush<TRoutes extends RouterRoutes> = {
  <TRouteKey extends keyof RoutesMap<TRoutes>>(...args: [source: TRouteKey, ...PushRouteWithParamsArgs<TRoutes, TRouteKey>, options?: RouterPushOptions | undefined]): Promise<void>,
  (source: Url, options?: RouterPushOptions): Promise<void>,
}