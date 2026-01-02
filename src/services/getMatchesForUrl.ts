import { routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute, routePathMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { Route, Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routePathMatches,
  routeQueryMatches,
  routeHashMatches,
  routeParamsAreValid,
]

export function getMatchesForUrl(routes: Routes, url: string): Route[] {
  const sortByRouteScore = getRouteScoreSortMethod(url)

  return routes
    .filter((route) => rules.every((test) => test(route, url)))
    .sort(sortByRouteScore)
}
