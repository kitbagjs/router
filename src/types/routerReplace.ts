import { RegisteredRoutes, RouterRoute } from '@/types'
import { RouterPushOptions } from '@/types/routerPush'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace<
  TRoutes extends RouterRoute[]
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath>, options?: RouterPushOptions) => Promise<void>

export type RegisteredRouterReplace = RouterReplace<RegisteredRoutes>

export type RouterReplaceImplementation = (source: string | RouteWithParamsImplementation, options?: RouterReplaceOptions) => Promise<void>