import { RouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { CreateRouteOptionsMatched } from '@/types'
import { RegisteredRouterRoute, RegisteredRoutesName } from '@/types/register'

export type IsRouteOptions = {
  exact?: boolean,
}

type RouteNamesInMatches<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name'],
> = TRoute['matches'] extends (infer U)[]
  ? U extends CreateRouteOptionsMatched<infer TNames>
    ? TRouteName extends TNames
      ? TNames
      : never
    : never
  : never

export function isRoute(route: unknown): route is RouterRoute

export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is TRoute & {name: TRouteName}

export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options?: IsRouteOptions): route is TRoute & {name: RouteNamesInMatches<typeof route, TRouteName>}

export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is RegisteredRouterRoute & { name: TRouteName }

export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options?: IsRouteOptions): route is RegisteredRouterRoute & {name: RouteNamesInMatches<RegisteredRouterRoute, TRouteName>}

export function isRoute(route: unknown, routeName?: string, options?: IsRouteOptions): boolean

export function isRoute(route: unknown, routeName?: string, { exact }: IsRouteOptions = {}): boolean {
  if (!isRouterRoute(route)) {
    return false
  }

  if (routeName === undefined) {
    return true
  }

  if (exact) {
    return route.matched.name === routeName
  }

  return route.matches.map((route) => route.name).includes(routeName)
}
