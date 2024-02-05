import { Resolved, Route, isNamedRoute } from '@/types'

export function flattenParentMatches(routes: Resolved<Route>): string {
  const namedAndPublicRoutesNames = routes.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)

  return namedAndPublicRoutesNames.join('.')
}