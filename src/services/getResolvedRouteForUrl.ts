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

  if (typeof route.key === 'undefined') {
    throw 'ResolvedRoute key must be defined'
  }

  return {
    matched: route.matched,
    matches: route.matches,
    key: route.key,
    query,
    params,
  }
}