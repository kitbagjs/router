import { generateRouteHashRegexPattern, generateRouteHostRegexPattern, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/services/routeRegex'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { createUrl } from '@/services/createUrl'

export const routeHostMatches: RouteMatchRule = (route, url) => {
  const { host } = createUrl(url)
  const hostPattern = generateRouteHostRegexPattern(route)

  return hostPattern.test(host.value)
}

export const routePathMatches: RouteMatchRule = (route, url) => {
  const { path } = createUrl(url)
  const pathPattern = generateRoutePathRegexPattern(route)

  return pathPattern.test(path.value)
}

export const routeQueryMatches: RouteMatchRule = (route, url) => {
  const { query } = createUrl(url)
  const queryString = query.value
  const queryPatterns = generateRouteQueryRegexPatterns(route)

  return queryPatterns.every((pattern) => pattern.test(queryString))
}

export const routeHashMatches: RouteMatchRule = (route, url) => {
  const { hash } = createUrl(url)
  const hashPattern = generateRouteHashRegexPattern(route)

  return hashPattern.test(hash.value)
}

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    route.parse(url)
  } catch {
    return false
  }

  return true
}
