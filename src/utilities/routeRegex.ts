import { RouterRoute } from '@/types'

export function generateRoutePathRegexPattern(route: RouterRoute): RegExp {
  const routeRegex = replaceParamSyntaxWithCatchAlls(route.path)

  return new RegExp(`^${routeRegex}$`, 'i')
}

export function generateRouteQueryRegexPatterns(route: RouterRoute): RegExp[] {
  const queryParams = new URLSearchParams(route.query)

  return Array
    .from(queryParams.entries())
    .map(([key, value]) => new RegExp(`${key}=${replaceParamSyntaxWithCatchAlls(value)}`, 'i'))
}

export function replaceParamSyntaxWithCatchAlls(value: string): string {
  return [
    replaceOptionalParamSyntaxWithCatchAll,
    replaceRequiredParamSyntaxWithCatchAll,
  ].reduce((pattern, regexBuild) => {
    return regexBuild(pattern)
  }, value)
}

function replaceOptionalParamSyntaxWithCatchAll(value: string): string {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g

  return value.replace(optionalParamRegex, '[^/]*')
}

function replaceRequiredParamSyntaxWithCatchAll(value: string): string {
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  return value.replace(requiredParamRegex, '[^/]+')
}