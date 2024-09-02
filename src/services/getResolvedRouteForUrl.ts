import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getRouteParamValues, routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute, routePathMatches, routeQueryMatches } from '@/services/routeMatchRules'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { getStateValues } from '@/services/state'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routePathMatches,
  routeQueryMatches,
  routeParamsAreValid,
]

export function getResolvedRouteForUrl(routes: Routes, url: string, state?: unknown): ResolvedRoute | undefined {
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    .filter(route => rules.every(test => test(route, url)))
    .sort(sortByRouteScore)

  if (matches.length === 0) {
    return undefined
  }

  const [route] = matches
  const { search } = createMaybeRelativeUrl(url)

  return {
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query: createResolvedRouteQuery(search),
    params: getRouteParamValues(route, url),
    state: getStateValues(route.state, state),
  }
}