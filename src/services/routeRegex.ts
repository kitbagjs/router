import { Route } from '@/types'

export function generateRoutePathRegexPattern(route: Route): RegExp {
  const routeRegex = replaceParamSyntaxWithCatchAlls(route.path.toString())

  return new RegExp(`^${routeRegex}$`, 'i')
}

export function generateRouteQueryRegexPatterns(route: Route): RegExp[] {
  const queryParams = new URLSearchParams(route.query.toString())

  return Array
    .from(queryParams.entries())
    .filter(([, value]) => !isOptionalParamSyntax(value))
    .map(([key, value]) => new RegExp(`${key}=${replaceParamSyntaxWithCatchAlls(value)}(&|$)`, 'i'))
}

export function replaceParamSyntaxWithCatchAlls(value: string): string {
  return [
    replaceOptionalParamSyntaxWithCatchAll,
    replaceRequiredParamSyntaxWithCatchAll,
  ].reduce((pattern, regexBuild) => {
    return regexBuild(pattern)
  }, value)
}

const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

function replaceOptionalParamSyntaxWithCatchAll(value: string): string {
  return value.replace(optionalParamRegex, '[^\\/]*')
}

function isOptionalParamSyntax(value: string): boolean {
  return optionalParamRegex.test(value)
}

function replaceRequiredParamSyntaxWithCatchAll(value: string): string {

  return value.replace(requiredParamRegex, '[^\\/]+')
}