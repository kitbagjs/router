import { RegisteredRoutes, RouteMethod, RouteMethodResponseImplementation, Routes } from '@/types'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'

export type RouterPushOptions = {
  query?: Record<string, string>,
  replace?: boolean,
}

export type RouterPush<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>, options?: RouterPushOptions) => Promise<void>

export type RegisteredRouterPush = RouterPush<RegisteredRoutes>

export type RouterPushImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation, options?: RouterPushOptions) => Promise<void>