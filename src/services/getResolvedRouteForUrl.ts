import { readonly } from 'vue'
import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getRouteParamValues, routeParamsAreValid } from '@/services/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/services/routeMatchRegexRules'
import { getRouteScoreSortMethod } from '@/services/routeMatchScore'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

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

  return readonly({
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