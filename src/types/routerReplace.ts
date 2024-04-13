import { RouterPushOptions } from '@/types/routerPush'
import { RouterRoutes } from '@/types/routerRoute'
import { RoutesMap } from '@/types/routesMap'
import { RouteWithParamsArgs } from '@/types/routeWithParams'
import { Url } from '@/types/url'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type ReplaceRouteWithParamsArgs<TRoutes extends RouterRoutes, TRouteKey extends string> = [
  source: TRouteKey,
  ...RouteWithParamsArgs<TRoutes, TRouteKey>,
  options?: RouterReplaceOptions | undefined
]

export type RouterReplace<TRoutes extends RouterRoutes> = {
  <TRouteKey extends keyof RoutesMap<TRoutes>>(...args: ReplaceRouteWithParamsArgs<TRoutes, TRouteKey>): Promise<void>,
  (source: Url, options?: RouterReplaceOptions): Promise<void>,
}