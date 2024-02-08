import { Resolved, Route, RouteMiddleware, isNamedRoute } from '@/types'
import { asArray } from '@/utilities/array'

export function getRoutePath(route: Resolved<Route>): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}

export function getRouteMiddleware(route: Resolved<Route>): RouteMiddleware[] {
  return route.matches.flatMap(route => asArray(route.middleware ?? []))
}