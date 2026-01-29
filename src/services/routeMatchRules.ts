import { parseUrl } from '@/services/urlParser'
import { generateRouteHashRegexPattern, generateRouteHostRegexPattern, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/services/routeRegex'
import { RouteMatchRule } from '@/types/routeMatchRule'

export const routeHostMatches: RouteMatchRule = (route, url) => {
  const { host } = parseUrl(url)
  const hostPattern = generateRouteHostRegexPattern(route)

  return hostPattern.test(host ?? '')
}

export const routePathMatches: RouteMatchRule = (route, url) => {
  const { path } = parseUrl(url)
  const pathPattern = generateRoutePathRegexPattern(route)

  return pathPattern.test(path)
}

export const routeQueryMatches: RouteMatchRule = (route, url) => {
  const { query } = parseUrl(url)
  const queryPatterns = generateRouteQueryRegexPatterns(route)

  return queryPatterns.every((pattern) => pattern.test(query.toString()))
}

export const routeHashMatches: RouteMatchRule = (route, url) => {
  const { hash } = parseUrl(url)
  const hashPattern = generateRouteHashRegexPattern(route)

  return hashPattern.test(hash)
}
