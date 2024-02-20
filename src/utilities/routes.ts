import { RouterRoute, RouteMiddleware, isNamedRoute } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { asArray } from '@/utilities/array'

export function getRoutePath(route: RouterRoute): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}

export function getRouteMiddleware(route: ResolvedRoute): Readonly<RouteMiddleware[]> {
  return route.matches.flatMap(route => {
    if (!route.middleware) {
      return []
    }

    return asArray(route.middleware) as RouteMiddleware[]
  })
}