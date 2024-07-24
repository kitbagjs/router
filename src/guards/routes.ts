import { combineKey } from '@/services/combineKey'
import { RouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { RegisteredRouterRoute, RegisteredRoutesKey } from '@/types/register'

export type IsRouteOptions = {
  exact?: boolean,
}

export function isRoute(route: unknown): route is RouterRoute

export function isRoute<
  TRoute extends RouterRoute,
  TRouteKey extends TRoute['key']
>(route: TRoute, routeKey: TRouteKey, options: IsRouteOptions & { exact: true }): route is TRoute & { key: TRouteKey }

export function isRoute<
  TRoute extends RouterRoute,
  TRouteKey extends TRoute['key']
>(route: TRoute, routeKey: TRouteKey, options?: IsRouteOptions): route is TRoute & { key: `${TRouteKey}${string}` }

export function isRoute<
  TRouteKey extends RegisteredRoutesKey
>(route: unknown, routeKey: TRouteKey, options: IsRouteOptions & { exact: true }): route is RegisteredRouterRoute & { key: TRouteKey }

export function isRoute<
  TRouteKey extends RegisteredRoutesKey
>(route: unknown, routeKey: TRouteKey, options?: IsRouteOptions): route is RegisteredRouterRoute & { key: `${TRouteKey}${string}` }

export function isRoute(route: unknown, routeKey?: string, options?: IsRouteOptions): boolean

export function isRoute(route: unknown, routeKey?: string, { exact }: IsRouteOptions = {}): boolean {
  if (!isRouterRoute(route)) {
    return false
  }

  if (routeKey === undefined) {
    return true
  }

  const keys = getRouteKeys(route)

  if (exact) {
    const actualRouteKey = keys.at(-1)

    return routeKey === actualRouteKey
  }

  return keys.includes(routeKey)
}

function getRouteKeys(route: RouterRoute): string[] {
  const names = route.matches.map(route => route.name)

  return names.reduce<string[]>((ancestorNames, name) => {
    const previous = ancestorNames.pop()
    const next = name ? [combineKey(previous, name)] : []

    if (!previous) {
      return next
    }

    return [
      ...ancestorNames,
      previous,
      ...next,
    ]
  }, [])
}