import { parseUrl } from '@/services/urlParser'
import { generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/services/routeRegex'
import { RouteMatchRule } from '@/types/routeMatchRule'

export const isNamedRoute: RouteMatchRule = (route) => {
  return 'name' in route.matched && !!route.matched.name
}

export const routePathMatches: RouteMatchRule = (route, url) => {
  const { pathname } = parseUrl(url)
  const pathPattern = generateRoutePathRegexPattern(route)

  return pathPattern.test(pathname)
}

export const routeQueryMatches: RouteMatchRule = (route, url) => {
  const { search } = parseUrl(url)
  const queryPatterns = generateRouteQueryRegexPatterns(route)

  return queryPatterns.every((pattern) => pattern.test(search))
}

export const routeHashMatches: RouteMatchRule = (route, url) => {
  const { hash } = parseUrl(url)
  const { value } = route.hash

  if (value === undefined) {
    return true
  }

  const cleanHash = `#${value.replace(/^#*/, '')}`

  return cleanHash.toLowerCase() === hash.toLowerCase()
}
