import { MaybeDeepReadonly, ResolvedRoute, RouteMiddleware, isNamedRoute } from '@/types'
import { asArray } from '@/utilities/array'

export function getRoutePath(route: ResolvedRoute): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}

export function getRouteMiddleware(route: MaybeDeepReadonly<ResolvedRoute>): Readonly<RouteMiddleware[]> {
  return route.matches.flatMap(route => {
    if (!route.middleware) {
      return []
    }

    return asArray(route.middleware) as RouteMiddleware[]
  })
}