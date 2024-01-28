import { RouteMethod, RouteMethods, Routes } from '@/types'
import { ExtractRoutePathParameters, RoutePaths } from '@/types/routePaths'
import { RouterResolve } from '@/utilities/createRouterResolve'
import { RouterNavigation } from '@/utilities/routerNavigation'

export type RouterPushOptions = {
  query?: Record<string, unknown>,
  replace?: boolean,
}

export type RouteWithParams<
  TRoutes extends Routes,
  TRoutePath extends string
> = {
  route: TRoutePath & RoutePaths<TRoutes>,
  params: ExtractRoutePathParameters<RouteMethods<TRoutes>, TRoutePath>,
}

export type RouterPush<
  TRoutes extends Routes
> = <
  TRoutePath extends string
>(source: string | RouteWithParams<TRoutes, TRoutePath> | ReturnType<RouteMethod>, options?: RouterPushOptions) => Promise<void>

type RouterPushContext = {
  navigation: RouterNavigation,
  resolve: RouterResolve,
}

export function createRouterPush<
  TRoutes extends Routes
>({ navigation, resolve }: RouterPushContext): RouterPush<TRoutes> {
  return (source, options) => {
    const url = resolve(source as any)

    return navigation.update(url, options)
  }
}