import { Resolved, Route, isNamedRoute, isPublicRoute } from '@/types'

export function flattenParentMatches(routes: Resolved<Route>): string {
  const namedAndPublicRoutesNames = routes.matches
    .filter(route => isNamedRoute(route) && isPublicRoute(route))
    .map(route => route.name)

  return namedAndPublicRoutesNames.join('.')
}