import { Route } from '@/types'

export function generateRoutePathRegexPattern(route: Route): RegExp {
  const routeRegex = replaceParamSyntaxWithCatchAlls(route.path.toString())

  return new RegExp(`^${routeRegex}$`, 'i')
}

export function generateRouteQueryRegexPatterns(route: Route): RegExp[] {
  const queryParams = new URLSearchParams(route.query.toString())

  return Array
    .from(queryParams.entries())
    .map(([key, value]) => new RegExp(`${key}(=${replaceParamSyntaxWithCatchAlls(value)})?(&|$)`, 'i'))
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