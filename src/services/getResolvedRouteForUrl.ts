import { routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute, routePathMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { createResolvedRoute } from './createResolvedRoute'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routePathMatches,
  routeQueryMatches,
  routeHashMatches,
  routeParamsAreValid,
]

export function getResolvedRouteForUrl(routes: Routes, url: string, state?: unknown): ResolvedRoute | undefined {
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    .filter((route) => rules.every((test) => test(route, url)))
    .sort(sortByRouteScore)

  if (matches.length === 0) {
    return undefined
  }

  const [route] = matches

  return createResolvedRoute(route, url, {state})
}
