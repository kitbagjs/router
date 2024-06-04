import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getRouteParamValues, routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute, routeHostMatches, routePathMatches, routeQueryMatches } from '@/services/routeMatchRules'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routeHostMatches,
  routePathMatches,
  routeQueryMatches,
  routeParamsAreValid,
]

export function getResolvedRouteForUrl(routes: Routes, url: string): ResolvedRoute | undefined {
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    .filter(route => rules.every(test => test(route, url)))
    .sort(sortByRouteScore)

  if (matches.length === 0) {
    return undefined
  }

  const [route] = matches
  const { search } = createMaybeRelativeUrl(url)
  const query = createResolvedRouteQuery(search)
  const params = getRouteParamValues(route, url)

  return {
    matched: route.matched,
    matches: route.matches,
    // enforced by isNamedRoute rule check
    key: route.key!,
    query,
    params,
  }
}