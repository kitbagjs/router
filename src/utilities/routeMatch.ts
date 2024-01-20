import { Route } from '@/types'
import { Resolved } from '@/types/resolved'
import { routeParamsAreValid } from '@/utilities/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/utilities/routeMatchRegexRules'

export function routeMatch(routes: Resolved<Route>[], url: string): Resolved<Route> | undefined {
  const rules = [routePathMatches, routeQueryMatches, routeParamsAreValid]

  return routes.find(route => rules.every(test => test(route, url)))
}