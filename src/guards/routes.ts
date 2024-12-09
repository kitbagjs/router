import { RouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { RegisteredRouterRoute, RegisteredRoutesName } from '@/types/register'

export type IsRouteOptions = {
  exact?: boolean,
}

type RouteWithMatch<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
> = TRoute extends RouterRoute
  ? TRouteName extends TRoute['matches'][number]['name']
    ? TRoute
    : never
  : never

/**
 * A type guard for determining if a value is a valid RouterRoute.
 * @param route - The value to check.
 * @returns `true` if the value is a valid RouterRoute, otherwise `false`.
 * @group Type Guards
 */
export function isRoute(route: unknown): route is RouterRoute

/**
 * A type guard for determining if a value is a valid RouterRoute with an exact match.
 * @param route - The value to check.
 * @param routeName - The expected route name.
 * @returns `true` if the value is a valid RouterRoute with an exact match, otherwise `false`.
 * @group Type Guards
 */
export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is TRoute & {name: TRouteName}

/**
 * A type guard for determining if a value is a valid RouterRoute with a partial match.
 * @param route - The value to check.
 * @param routeName - The expected route name.
 * @returns `true` if the value is a valid RouterRoute with a partial match, otherwise `false`.
 * @group Type Guards
 */
export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options?: IsRouteOptions): route is RouteWithMatch<TRoute, TRouteName>

/**
 * A type guard for determining if a value is a valid RegisteredRouterRoute with an exact match.
 * @param route - The value to check.
 * @param routeName - The expected route name.
 * @returns `true` if the value is a valid RegisteredRouterRoute with an exact match, otherwise `false`.
 * @group Type Guards
 */
export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is RegisteredRouterRoute & { name: TRouteName }

/**
 * A type guard for determining if a value is a valid RegisteredRouterRoute with a partial match.
 * @param route - The value to check.
 * @param routeName - The expected route name.
 * @returns `true` if the value is a valid RegisteredRouterRoute with a partial match, otherwise `false`.
 * @group Type Guards
 */
export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options?: IsRouteOptions): route is RouteWithMatch<RegisteredRouterRoute, TRouteName>

/**
 * A type guard for determining if a value is a valid RouterRoute.
 * @param route - The value to check.
 * @param routeName - The expected route name.
 * @returns `true` if the value is a valid RouterRoute, otherwise `false`.
 * @group Type Guards
 */
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
