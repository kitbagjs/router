import { parseUrl } from '@/services/urlParser'
import { generateRouteHostRegexPattern, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns } from '@/services/routeRegex'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { stringHasValue } from '@/utilities'

export const isNamedRoute: RouteMatchRule = (route) => {
  return 'name' in route.matched && !!route.matched.name
}

export const routeHostMatches: RouteMatchRule = (route, url) => {
  const { host } = parseUrl(url)
  const hostPattern = generateRouteHostRegexPattern(route)

  if (!host || !route.host.value) {
    return true
  }

  return hostPattern.test(host)
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

  if (!stringHasValue(value)) {
    return true
  }

  const cleanHash = `#${value.replace(/^#*/, '')}`

  return cleanHash.toLowerCase() === hash.toLowerCase()
}
