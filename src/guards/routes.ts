import { RouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { toName } from '@/types/name'
import { RegisteredRouterRoute, RegisteredRoutesName } from '@/types/register'

type RouteWithMatch<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
> = TRoute extends RouterRoute
  ? TRouteName extends TRoute['matches'][number]['name']
    ? TRoute
    : never
  : never

export type IsRouteOptions = {
  exact?: boolean,
}

export function isRoute(route: unknown): route is RouterRoute

export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is TRoute & { name: TRouteName }

export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options?: IsRouteOptions): route is RouteWithMatch<TRoute, TRouteName>

export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is RegisteredRouterRoute & { name: TRouteName }

export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options?: IsRouteOptions): route is RouteWithMatch<RegisteredRouterRoute, TRouteName>

export function isRoute(route: unknown, routeName?: string, options?: IsRouteOptions): boolean

export function isRoute(route: unknown, routeName?: string, { exact }: IsRouteOptions = {}): boolean {
  if (!isRouterRoute(route)) {
    return false
  }

  if (routeName === undefined) {
    return true
  }

  const names = route.matches.map((route) => toName(route.name))

  if (exact) {
    const actualRouteName = names.at(-1)

    return routeName === actualRouteName
  }

  return names.includes(routeName)
}
