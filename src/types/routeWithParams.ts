import { RegisteredRoutes } from '@/types/register'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types/routerRoute'

export type RouteWithParams<
  TRoutes extends Readonly<RouterRoute[]>,
  TRoutePath extends string
> = {
  route: TRoutePath,
  params: RouteParamsByName<TRoutes, TRoutePath>,
}

export type RegisteredRouteWithParams<T extends string> = RouteWithParams<RegisteredRoutes, T>
export type RouteWithParamsImplementation = { route: string, params?: Record<string, unknown> }

type ExtractNamedElements<T> = T extends { name: string }? T : never

type RoutesMap<TRoutes extends Readonly<RouterRoute[]> > = RouterRoute & {
  [K in TRoutes[number] as ExtractNamedElements<K> extends { name: string } ? ExtractNamedElements<K>['name']: never]: ExtractNamedElements<K>
}

export type RouteGetByName<TRoutes extends Readonly<RouterRoute[]>, TName extends keyof RoutesMap<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends Readonly<RouterRoute[]>,
  TName extends string
> = ExtractRouterRouteParamTypes<RouteGetByName<TRoutes, TName>>