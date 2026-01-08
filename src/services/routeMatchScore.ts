import { parseUrl } from '@/services/urlParser'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types/route'
import { QuerySource } from '@/types/querySource'
import { paramIsOptional } from '@/services/routeRegex'
import { stringHasValue } from '@/utilities/guards'

type RouteSortMethod = (aRoute: Route, bRoute: Route) => number

const SORT_BEFORE = -1
const SORT_AFTER = 1

export function getRouteScoreSortMethod(url: string): RouteSortMethod {
  const { searchParams: actualQuery, pathname: actualPath } = parseUrl(url)

  return (aRoute, bRoute) => {
    const preferLowerDepth = sortPreferLowerDepth(aRoute, bRoute)
    if (preferLowerDepth !== 0) {
      return preferLowerDepth
    }

    const preferMoreExplicitHost = sortPreferMatchingHost(aRoute, bRoute)
    if (preferMoreExplicitHost !== 0) {
      return preferMoreExplicitHost
    }

    const preferMoreExplicitHash = sortPreferMatchingHash(aRoute, bRoute)
    if (preferMoreExplicitHash !== 0) {
      return preferMoreExplicitHash
    }

    const preferMoreOptionalParamsFulfilled = sortPreferMoreOptionalParamsFulfilled(aRoute, bRoute, actualQuery, actualPath)
    if (preferMoreOptionalParamsFulfilled !== 0) {
      return preferMoreOptionalParamsFulfilled
    }

    return 0
  }
}

function sortPreferLowerDepth(aRoute: Route, bRoute: Route): number {
  if (aRoute.depth > bRoute.depth) {
    return SORT_BEFORE
  }

  if (aRoute.depth < bRoute.depth) {
    return SORT_AFTER
  }

  return 0
}

function sortPreferMoreOptionalParamsFulfilled(aRoute: Route, bRoute: Route, actualQuery: QuerySource, actualPath: string): number {
  const aRouteQueryScore = countExpectedQueryParams(aRoute, actualQuery)
  const aRoutePathScore = countExpectedPathParams(aRoute, actualPath)
  const bRouteQueryScore = countExpectedQueryParams(bRoute, actualQuery)
  const bRoutePathScore = countExpectedPathParams(bRoute, actualPath)

  if (aRouteQueryScore + aRoutePathScore > bRouteQueryScore + bRoutePathScore) {
    return SORT_BEFORE
  }
  if (aRouteQueryScore + aRoutePathScore < bRouteQueryScore + bRoutePathScore) {
    return SORT_AFTER
  }

  return 0
}

function sortPreferMatchingHost(aRoute: Route, bRoute: Route): number {
  const aHasExplicitHost = stringHasValue(aRoute.host.value)
  const bHasExplicitHost = stringHasValue(bRoute.host.value)

  if (aHasExplicitHost && !bHasExplicitHost) {
    return SORT_BEFORE
  }

  if (!aHasExplicitHost && bHasExplicitHost) {
    return SORT_AFTER
  }

  return 0
}

function sortPreferMatchingHash(aRoute: Route, bRoute: Route): number {
  const aHasExplicitHash = stringHasValue(aRoute.hash.value)
  const bHasExplicitHash = stringHasValue(bRoute.hash.value)

  if (aHasExplicitHash && !bHasExplicitHash) {
    return SORT_BEFORE
  }

  if (!aHasExplicitHash && bHasExplicitHash) {
    return SORT_AFTER
  }

  return 0
}

export function countExpectedPathParams(route: Route, actualPath: string): number {
  const optionalParams = Object.keys(route.path.params)
    .filter((key) => paramIsOptional(route.path, key))
    .map((key) => key)

  const missing = optionalParams.filter((expected) => getParamValueFromUrl(actualPath, route.path, expected) === undefined)

  return optionalParams.length - missing.length
}

export function countExpectedQueryParams(route: Route, actualQuery: QuerySource): number {
  const actualQueryParams = new URLSearchParams(actualQuery)
  const expectedQuery = new URLSearchParams(route.query.value)
  const expectedQueryKeys = Array.from(expectedQuery.keys())

  const missing = expectedQueryKeys.filter((expected) => !actualQueryParams.has(expected))

  return expectedQueryKeys.length - missing.length
}
