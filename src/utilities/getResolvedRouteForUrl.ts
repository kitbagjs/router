import { RouteMatchRule } from '@/types'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { createMaybeRelativeUrl } from '@/utilities/createMaybeRelativeUrl'
import { createResolvedRoute } from '@/utilities/createResolvedRoute'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
import { getRouteParamValues, routeParamsAreValid } from '@/utilities/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/utilities/routeMatchRegexRules'
import { getRouteScoreSortMethod } from '@/utilities/routeMatchScore'

export function getResolvedRouteForUrl(routes: Routes, url: string): ResolvedRoute | undefined {
  const rules = [isNamedRoute, routePathMatches, routeQueryMatches, routeParamsAreValid]
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

  return createResolvedRoute({
    matched: route.matched,
    matches: route.matches,
    key: route.key,
    query,
    params,
  })
}

const isNamedRoute: RouteMatchRule = (route) => {
  return 'name' in route.matched && !!route.matched.name
}