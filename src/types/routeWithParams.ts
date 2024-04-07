import { RegisteredRoutes } from '@/types/register'
import { ExtractRouterRouteParamTypes, RouterRoute, RouterRoutes } from '@/types/routerRoute'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouteWithParams<
  TRoutes extends RouterRoutes,
  TRoutePath extends string
> = {
  route: TRoutePath,
} & RouteParams<RouteParamsByName<TRoutes, TRoutePath>>

export type RegisteredRouteWithParams<T extends string> = RouteWithParams<RegisteredRoutes, T>
export type RouteWithParamsImplementation = { route: string, params?: Record<string, unknown> }

type ExtractNamedElements<T> = T extends { name: string }? T : never

type RoutesMap<TRoutes extends RouterRoutes > = RouterRoute & {
  [K in TRoutes[number] as ExtractNamedElements<K> extends { name: string } ? ExtractNamedElements<K>['name']: never]: ExtractNamedElements<K>
}

type RouteParams<T extends Record<string, unknown>> = AllPropertiesAreOptional<T> extends true ? { params?: T } : { params: T }

export type RouteGetByName<TRoutes extends RouterRoutes, TName extends keyof RoutesMap<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends RouterRoutes,
  TName extends string
> = ExtractRouterRouteParamTypes<RouteGetByName<TRoutes, TName>>