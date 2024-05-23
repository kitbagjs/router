import { Route } from '@/types'
import { paramEnd, paramStart } from '@/types/params'
import { stringHasValue } from '@/utilities/string'

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

const optionalParamRegex = `\\${paramStart}\\?([\\w-_]+)\\${paramEnd}`
const requiredParamRegex = `\\${paramStart}([\\w-_]+)\\${paramEnd}`

function replaceOptionalParamSyntaxWithCatchAll(value: string): string {
  return value.replace(new RegExp(optionalParamRegex, 'g'), '.*')
}

export function isOptionalParamSyntax(value: string): boolean {
  return new RegExp(optionalParamRegex, 'g').test(value)
}

function replaceRequiredParamSyntaxWithCatchAll(value: string): string {

  return value.replace(new RegExp(requiredParamRegex, 'g'), '.+')
}

export function isRequiredParamSyntax(value: string): boolean {
  return new RegExp(requiredParamRegex, 'g').test(value)
}

export function getParamName(value: string): string | undefined {
  const [optionalName] = getCaptureGroups(value, new RegExp(optionalParamRegex, 'g'))
  const [requiredName] = getCaptureGroups(value, new RegExp(requiredParamRegex, 'g'))

  return optionalName ?? requiredName
}

export function getCaptureGroups(value: string, pattern: RegExp): (string | undefined)[] {
  const matches = Array.from(value.matchAll(pattern))

  return matches.flatMap(([, ...values]) => values.map(value => stringHasValue(value) ? value : ''))
}