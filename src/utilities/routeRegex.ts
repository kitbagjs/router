import { Resolved, Route } from '@/types'

export function generateRoutePathRegexPattern(route: Resolved<Route>): RegExp {
  const routeRegex = replaceParamSyntaxWithCatchAlls(route.path)

  return new RegExp(`^${routeRegex}$`)
}

export function generateRouteQueryRegexPatterns(route: Resolved<Route>): RegExp[] {
  const queryParams = new URLSearchParams(route.query)

  return Array
    .from(queryParams.entries())
    .map(([key, value]) => new RegExp(`${key}=${replaceParamSyntaxWithCatchAlls(value)}`))
}

function replaceParamSyntaxWithCatchAlls(value: string): string {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  return value.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)')
}