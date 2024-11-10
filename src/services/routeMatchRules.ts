import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/services/routeRegex'
import { RouteMatchRule } from '@/types/routeMatchRule'

export const isNamedRoute: RouteMatchRule = (route) => {
  return 'name' in route.matched && !!route.matched.name
}

export const routePathMatches: RouteMatchRule = (route, url) => {
  const { pathname } = createMaybeRelativeUrl(url)
  const pathPattern = generateRoutePathRegexPattern(route)

  return pathPattern.test(pathname)
}

export const routeQueryMatches: RouteMatchRule = (route, url) => {
  const { search } = createMaybeRelativeUrl(url)
  const queryPatterns = generateRouteQueryRegexPatterns(route)

  return queryPatterns.every((pattern) => pattern.test(search))
}

export const routeHashMatches: RouteMatchRule = (route, url) => {
  const { hash } = createMaybeRelativeUrl(url)
  const { value } = route.hash

  return value === undefined || `#${value.toLowerCase()}` === hash.toLowerCase()
}
