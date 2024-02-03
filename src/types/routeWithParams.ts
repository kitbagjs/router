import { RegisteredRoutes } from '@/types/register'
import { RouteMethods } from '@/types/routeMethods'
import { ExtractRoutePathParameters, RoutePaths } from '@/types/routePaths'
import { Routes } from '@/types/routes'

export type RouteWithParams<
  TRoutes extends Routes,
  TRoutePath extends string
> = {
  route: TRoutePath & RoutePaths<TRoutes>,
  params: ExtractRoutePathParameters<RouteMethods<TRoutes>, TRoutePath>,
}

export type RegisteredRouteWithParams<T extends string> = RouteWithParams<RegisteredRoutes, T>

export type RouteWithParamsImplementation = { route: string, params?: Record<string, unknown> }