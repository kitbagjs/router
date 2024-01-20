import { RouteMatchRule } from '@/types'
import { generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/utilities/routeRegex'
import { splitUrl } from '@/utilities/urlSplitter'

export const routePathMatches: RouteMatchRule = (route, url) => {
  const { path = '' } = splitUrl(url)
  const pathPattern = generateRoutePathRegexPattern(route)

  return pathPattern.test(path)
}

export const routeQueryMatches: RouteMatchRule = (route, url) => {
  const { query = '' } = splitUrl(url)
  const queryPatterns = generateRouteQueryRegexPatterns(route)

  return queryPatterns.every(pattern => pattern.test(query))
}