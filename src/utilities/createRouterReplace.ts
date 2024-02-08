import { RouteMethod, RouteMethodResponseImplementation } from '@/types/routeMethod'
import { Routes } from '@/types/routes'
import { RouteWithParams, RouteWithParamsImplementation } from '@/types/routeWithParams'
import { RouterPushImplementation, RouterPushOptions } from '@/utilities/createRouterPush'

export type RouterReplaceOptions = Omit<RouterPushOptions, 'replace'>

export type RouterReplace<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>, options?: RouterPushOptions) => Promise<void>

export type RouterReplaceImplementation = (source: string | RouteWithParamsImplementation | RouteMethodResponseImplementation, options?: RouterReplaceOptions) => Promise<void>

type RouterReplaceContext = {
  push: RouterPushImplementation,
}

export function createRouterReplace({ push }: RouterReplaceContext): RouterReplaceImplementation {
  return (source, options) => {
    return push(source, { ...options, replace: true })
  }
}