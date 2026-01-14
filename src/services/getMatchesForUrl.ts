import { routeHostMatches, routePathMatches, routeQueryMatches, routeHashMatches, routeParamsAreValid } from '@/services/routeMatchRules'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { Route, Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routeHostMatches,
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
