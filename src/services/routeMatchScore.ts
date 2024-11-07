import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types/route'

type RouteSortMethod = (aRoute: Route, bRoute: Route) => number

export function getRouteScoreSortMethod(url: string): RouteSortMethod {
  const { searchParams: actualQuery, pathname: actualPath } = createMaybeRelativeUrl(url)
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

    const { hash } = createMaybeRelativeUrl(url)
    if (aRoute.hash.toString() === hash) {
      return sortBefore
    }
    if (bRoute.hash.toString() === hash) {
      return sortAfter
    }

    return 0
  }
}

export function countExpectedPathParams(route: Route, actualPath: string): number {
  const optionalParams = Object.keys(route.path.params)
    .filter((key) => key.startsWith('?'))
    .map((key) => key)

  const missing = optionalParams.filter((expected) => getParamValueFromUrl(actualPath, route.path.toString(), expected) === undefined)

  return optionalParams.length - missing.length
}

export function countExpectedQueryParams(route: Route, actualQuery: URLSearchParams): number {
  const expectedQuery = new URLSearchParams(route.query.toString())
  const expectedQueryKeys = Array.from(expectedQuery.keys())

  const missing = expectedQueryKeys.filter((expected) => !actualQuery.has(expected))

  return expectedQueryKeys.length - missing.length
}
