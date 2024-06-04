import { combineName } from '@/services/combineName'
import { RouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { RegisteredRouteMap, RegisteredRouter, RegisteredRoutesKey } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'

export type IsRouteOptions = {
  exact?: boolean,
}

export function isRoute(route: RouterRoute): route is RegisteredRouter['route']
export function isRoute<TRouteKey extends RegisteredRoutesKey>(route: RouterRoute, routeKey: TRouteKey, options?: IsRouteOptions): route is RouterRoute<ResolvedRoute<RegisteredRouteMap[TRouteKey]>>
export function isRoute(route: RouterRoute, routeKey?: string, { exact }: IsRouteOptions = {}): boolean {
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
    const next = name ? [combineName(previous, name)] : []

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