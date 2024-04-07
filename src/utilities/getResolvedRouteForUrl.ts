import { ResolvedRoute } from '@/types/resolved'
import { RouterRoutes } from '@/types/routerRoute'
import { createMaybeRelativeUrl } from '@/utilities/createMaybeRelativeUrl'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
import { getRouteParamValues, routeParamsAreValid } from '@/utilities/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/utilities/routeMatchRegexRules'
import { getRouteScoreSortMethod } from '@/utilities/routeMatchScore'

export function getResolvedRouteForUrl(routes: RouterRoutes, url: string): ResolvedRoute | undefined {
  // const rules = [routePathMatches, routeQueryMatches, routeParamsAreValid]
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    // .filter(route => rules.every(test => test(route, url)))
    .filter(route => {
      if (!routePathMatches(route, url)) {
        return false
      }
      if (!routeQueryMatches(route, url)) {
        return false
      }
      if (!routeParamsAreValid(route, url)) {
        return false
      }

      return true
    })
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
    name: route.name,
    query,
    params,
  }
}