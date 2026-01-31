import { Route, Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { routePathMatches, routeHostMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute } from '@/utilities/isNamedRoute'

export function getMatchForUrl(routes: Routes, url: string, isExternal: boolean = false): Route | undefined {
  return routes
    .filter((route) => !!route.host.value === isExternal)
    .find((route) => routeMatches(route, url))
}

function routeMatches(route: Route, url: string): boolean {
  const matchRules: RouteMatchRule[] = [
    isNamedRoute,
    routeHostMatches,
    routePathMatches,
    routeQueryMatches,
    routeHashMatches,
    routeParamsAreValid,
  ]

  return matchRules.every((rule) => rule(route, url))
}
