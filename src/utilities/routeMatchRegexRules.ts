import { RouteMatchRule } from '@/types'
import { createMaybeRelativeUrl } from '@/utilities/createMaybeRelativeUrl'
import { generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/utilities/routeRegex'

export const routePathMatches: RouteMatchRule = (route, url) => {
  const { pathname } = createMaybeRelativeUrl(url)
  const pathPattern = generateRoutePathRegexPattern(route)

  return pathPattern.test(pathname)
}

export const routeQueryMatches: RouteMatchRule = (route, url) => {
  const { search } = createMaybeRelativeUrl(url)
  const queryPatterns = generateRouteQueryRegexPatterns(route)

  return queryPatterns.every(pattern => pattern.test(search))
}