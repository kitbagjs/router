import { ResolvedRoute, RouteMiddleware, isNamedRoute } from '@/types'
import { asArray } from '@/utilities/array'
import { RouterRoute } from '@/utilities/createRouterRoute'
import { createRouterRouteQuery } from '@/utilities/createRouterRouteQuery'
import { getRouteParams, routeParamsAreValid } from '@/utilities/paramValidation'
import { routePathMatches, routeQueryMatches } from '@/utilities/routeMatchRegexRules'
import { getRouteScoreSortMethod } from '@/utilities/routeMatchScore'

export function getRouterRouteForUrl(routes: ResolvedRoute[], url: string): RouterRoute | undefined {
  const rules = [routePathMatches, routeQueryMatches, routeParamsAreValid]
  const sortByRouteScore = getRouteScoreSortMethod(url)

  const matches = routes
    .filter(route => rules.every(test => test(route, url)))
    .sort(sortByRouteScore)

  if (matches.length === 0) {
    return undefined
  }

  const [route] = matches
  const [, search] = url.split('?')
  const query = createRouterRouteQuery(search)
  const params = getRouteParams(route, url)

  return {
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query,
    params,
  }
}

export function getRoutePath(route: ResolvedRoute): string {
  return route.matches
    .filter(route => isNamedRoute(route))
    .map(route => route.name)
    .join('.')
}

export function getRouteMiddleware(route: RouterRoute): Readonly<RouteMiddleware[]> {
  return route.matches.flatMap(route => {
    if (!route.middleware) {
      return []
    }

    return asArray(route.middleware) as RouteMiddleware[]
  })
}