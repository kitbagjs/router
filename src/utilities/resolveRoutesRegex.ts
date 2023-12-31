import { Resolved, Route } from '@/types'
import { generateRouteRegexPattern } from '@/utilities/routeRegex'

export type ResolvedWithRegex = {
  regexp: RegExp,
  route: Resolved<Route>,
}

export function resolveRoutesRegex(routes: Resolved<Route>[]): ResolvedWithRegex[] {
  return routes.map(route => {
    const regexp = generateRouteRegexPattern(route.path)

    return { regexp, route }
  })
}