import { isRouterRoute } from '@/services/createRouterRoute'
import type { RouterRoute } from '@/types/routerRoute'
import { Router, RouterRouteName } from '@/types/router'
import { InjectionKey } from 'vue'

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

type IsRouteFunction<TRouter extends Router> = {
  /**
   * A type guard for determining if a value is a valid RouterRoute.
   * @param route - The value to check.
   * @returns `true` if the value is a valid RouterRoute, otherwise `false`.
   * @group Type Guards
   */
  (route: unknown): route is RouterRoute,

  /**
   * A type guard for determining if a value is a valid RouterRoute with an exact match.
   * @param route - The value to check.
   * @param routeName - The expected route name.
   * @returns `true` if the value is a valid RouterRoute with an exact match, otherwise `false`.
   * @group Type Guards
   */
  <
    TRoute extends TRouter['route'],
    TRouteName extends RouterRouteName<TRouter>
  >(route: TRoute, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is TRoute & { name: TRouteName },

  /**
   * A type guard for determining if a value is a valid RouterRoute with a partial match.
   * @param route - The value to check.
   * @param routeName - The expected route name.
   * @returns `true` if the value is a valid RouterRoute with a partial match, otherwise `false`.
   * @group Type Guards
   */
  <
    TRoute extends TRouter['route'],
    TRouteName extends TRoute['name']
  >(route: TRoute, routeName: TRouteName, options?: IsRouteOptions): route is RouteWithMatch<TRoute, TRouteName>,

  /**
   * A type guard for determining if a value is a valid RouterRoute.
   * @param route - The value to check.
   * @param routeName - The expected route name.
   * @returns `true` if the value is a valid RouterRoute, otherwise `false`.
   * @group Type Guards
   */
  (route: unknown, routeName?: string, options?: IsRouteOptions): boolean,
}

export function createIsRoute<TRouter extends Router>(routerKey: InjectionKey<TRouter>): IsRouteFunction<TRouter> {
  return (route: unknown, routeName?: string, { exact }: IsRouteOptions = {}): route is any => {
    if (!isRouterRoute(routerKey, route)) {
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
}
