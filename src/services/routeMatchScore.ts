import { parseUrl } from '@/services/urlParser'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types/route'
import { routeHashMatches } from '@/services/routeMatchRules'
import { QuerySource } from '@/types/querySource'
import { paramIsOptional } from '@/services/routeRegex'

type RouteSortMethod = (aRoute: Route, bRoute: Route) => number

export function getRouteScoreSortMethod(url: string): RouteSortMethod {
  const { searchParams: actualQuery, pathname: actualPath } = parseUrl(url)
  const sortBefore = -1
  const sortAfter = +1

  return (aRoute, bRoute) => {
    const aRouteQueryScore = countExpectedQueryParams(aRoute, actualQuery)
    const aRoutePathScore = countExpectedPathParams(aRoute, actualPath)
    const bRouteQueryScore = countExpectedQueryParams(bRoute, actualQuery)
    const bRoutePathScore = countExpectedPathParams(bRoute, actualPath)

    if (aRoute.depth > bRoute.depth) {
      return sortBefore
    }
    if (aRoute.depth < bRoute.depth) {
      return sortAfter
    }

    if (aRouteQueryScore + aRoutePathScore > bRouteQueryScore + bRoutePathScore) {
      return sortBefore
    }
    if (aRouteQueryScore + aRoutePathScore < bRouteQueryScore + bRoutePathScore) {
      return sortAfter
    }

    if (routeHashMatches(aRoute, url)) {
      return sortBefore
    }
    if (routeHashMatches(bRoute, url)) {
      return sortAfter
    }

    return 0
  }
}

export function countExpectedPathParams(route: Route, actualPath: string): number {
  const optionalParams = Object.keys(route.path.params)
    .filter((key) => paramIsOptional(route.path, key))
    .map((key) => key)

  const missing = optionalParams.filter((expected) => getParamValueFromUrl(actualPath, route.path, expected) === undefined)

  return optionalParams.length - missing.length
}

export function countExpectedQueryParams(route: Route, actual: QuerySource): number {
  const actualQuery = new URLSearchParams(actual)
  const expectedQuery = new URLSearchParams(route.query.value)
  const expectedQueryKeys = Array.from(expectedQuery.keys())

  const missing = expectedQueryKeys.filter((expected) => !actualQuery.has(expected))

  return expectedQueryKeys.length - missing.length
}
