import { RegisteredRoutes, RouterRoutes } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'

export type RouterPushOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type RouterPush<
  TRoutes extends RouterRoutes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>, options?: RouterPushOptions) => Promise<void>

export type RegisteredRouterPush = RouterPush<RegisteredRoutes>

export type RouterPushImplementation = (source: string | RouteWithParamsImplementation, options?: RouterPushOptions) => Promise<void>