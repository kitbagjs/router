import { RegisteredRoutes } from '@/types/register'
import { ExtractRouterRouteParamTypes, RouterRoutes } from '@/types/routerRoute'
import { AllPropertiesAreOptional } from '@/types/utilities'

export type RouteWithParams<
  TRoutes extends RouterRoutes,
  TRoutePath extends string,
  TRouteMap extends RoutesMap = RoutesMap<TRoutes>
> = TRoutePath extends keyof TRouteMap ? {
  route: TRoutePath,
} & RouteParams<RouteParamsByName<TRoutes, TRoutePath>>
  : never

export type RegisteredRouteMap = RoutesMap
export type RegisteredRouteWithParams<T extends keyof RegisteredRouteMap> = RouteWithParams<RegisteredRoutes, T>
export type RouteWithParamsImplementation = { route: string, params?: Record<string, unknown> }

type BaseRouterRoute = { name: string, disabled: false, pathParams: Record<string, unknown>, queryParams: Record<string, unknown> }
type NamedNotDisabled<T> = T extends BaseRouterRoute ? T : never

type RoutesMap<TRoutes extends RouterRoutes = []> = {
  [K in TRoutes[number] as NamedNotDisabled<K> extends { name: string } ? NamedNotDisabled<K>['name']: never]: NamedNotDisabled<K>
}

type RouteParams<T extends Record<string, unknown>> = AllPropertiesAreOptional<T> extends true ? { params?: T } : { params: T }

export type RouteGetByName<TRoutes extends RouterRoutes, TName extends keyof RoutesMap<TRoutes>> = RoutesMap<TRoutes>[TName]
export type RouteParamsByName<
  TRoutes extends RouterRoutes,
  TName extends string
> = ExtractRouterRouteParamTypes<RouteGetByName<TRoutes, TName>>