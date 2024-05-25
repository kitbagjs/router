import { combineName } from '@/services/combineName'
import { RouterRoute } from '@/services/createRouterRoute'
import { RegisteredRouteMap } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'

export type RouteIsOptions = {
  exact?: boolean,
}

export function routeIs<TRouteKey extends string & keyof RegisteredRouteMap>(route: RouterRoute, routeKey: TRouteKey, { exact }: RouteIsOptions = {}): route is RouterRoute<ResolvedRoute<RegisteredRouteMap[TRouteKey]>> {
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