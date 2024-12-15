import { getRouteParamValues, routeParamsAreValid } from '@/services/paramValidation'
import { isNamedRoute, routePathMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { parseUrl } from './urlParser'
import { createResolvedRouteQuery } from './createResolvedRouteQuery'
import { getStateValues } from './state'
import { asUrl } from '@/types'

const rules: RouteMatchRule[] = [
  isNamedRoute,
  routePathMatches,
  routeQueryMatches,
  routeHashMatches,
  routeParamsAreValid,
]

export function createResolvedRouteForUrl(routes: Routes, url: string, state?: unknown): ResolvedRoute | undefined {
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    .filter((route) => rules.every((test) => test(route, url)))
    .sort(sortByRouteScore)

  if (matches.length === 0) {
    return undefined
  }

  const [route] = matches
  const { search, hash } = parseUrl(url)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query: createResolvedRouteQuery(search),
    params: getRouteParamValues(route, url),
    state: getStateValues(route.state, state),
    hash,
    href: asUrl(url)
  }
}
