import { RegisteredRoutes } from '@/types'
import { RouteMethod, RouteMethodResponseImplementation } from '@/types/routeMethod'
import { RouterPushOptions } from '@/types/routerPush'
import { Routes } from '@/types/routes'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>, options?: RouterPushOptions) => Promise<void>

export type RegisteredRouterReplace = RouterReplace<RegisteredRoutes>

export type RouterReplaceImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation, options?: RouterReplaceOptions) => Promise<void>