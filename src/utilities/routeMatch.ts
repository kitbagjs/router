import { Route } from '@/types'
import { Resolved } from '@/types/resolved'
import { routeParamsAreValid } from '@/utilities/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/utilities/routeMatchRegexRules'
import { getRouteScoreSortMethod } from '@/utilities/routeMatchScore'

export function routeMatch(routes: Resolved<Route>[], url: string): Resolved<Route> | undefined {
  const rules = [routePathMatches, routeQueryMatches, routeParamsAreValid]
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const [match] = routes
    .filter(route => rules.every(test => test(route, url)))
    .sort(sortByRouteScore)

  return match
}