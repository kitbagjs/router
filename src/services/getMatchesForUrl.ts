import { Route, Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { routePathMatches, routeHostMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute } from '@/utilities/isNamedRoute'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routeHostMatches,
  routePathMatches,
  routeQueryMatches,
  routeHashMatches,
  routeParamsAreValid,
]

export function getMatchForUrl(routes: Routes, url: string, isExternal: boolean = false): Route | undefined {
  return routes
    .filter((route) => !!route.host.value === isExternal)
    .find((route) => rules.every((rule) => rule(route, url)))
}
