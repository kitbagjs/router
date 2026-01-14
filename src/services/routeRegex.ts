import { paramEnd, paramStart } from '@/types/params'
import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { WithParams } from '@/services/withParams'

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function splitByMatches(string: string, regexp: RegExp): string[] {
  const matches = Array.from(string.matchAll(regexp))

  if (matches.length === 0) {
    return [string]
  }

  let lastSlice = 0
  const slices = matches.reduce<string[]>((slices, match) => {
    const slice = escapeRegExp(string.slice(lastSlice, match.index))

    if (slice.length) {
      slices.push(slice)
    }

    const [value] = match
    slices.push(value)
    lastSlice = match.index + value.length
    return slices
  }, [])

  const last = string.slice(lastSlice)

  if (last) {
    slices.push(last)
  }

  return slices
}

export function generateRouteHostRegexPattern(route: Route): RegExp {
  const hostRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(route.host.schema.value)

  return new RegExp(`^${hostRegex || '.*'}$`, 'i')
}

export function generateRoutePathRegexPattern(route: Route): RegExp {
  const pathRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(route.path.schema.value)

  return new RegExp(`^${pathRegex}$`, 'i')
}

export function generateRouteHashRegexPattern(route: Route): RegExp {
  const cleanValue = route.hash.schema.value.replace(/^#*/, '')
  const hashRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(cleanValue)

  return new RegExp(`^#?${hashRegex || '.*'}$`, 'i')
}

export function generateRouteQueryRegexPatterns(route: Route): RegExp[] {
  const queryParams = new URLSearchParams(route.query.schema.value)

  return Array
    .from(queryParams.entries())
    .filter(([, value]) => !isOptionalParamSyntax(value))
    .map(([key, value]) => {
      const valueRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(value)

      return new RegExp(`${escapeRegExp(key)}=${valueRegex}(&|$)`, 'i')
    })
}

function replaceParamSyntaxWithCatchAllsAndEscapeRest(value: string): string {
  return splitByMatches(value, new RegExp(paramRegex, 'g'))
    .map((slice) => {
      const isParam = slice.startsWith(paramStart)

      return isParam ? replaceParamSyntaxWithCatchAlls(slice) : escapeRegExp(slice)
    })
    .join('')
}

export function replaceParamSyntaxWithCatchAlls(value: string): string {
  return value.replace(new RegExp(paramRegex, 'g'), regexCatchAll)
}

export function replaceIndividualParamWithCaptureGroup(path: string, paramName: string): string {
  const paramRegex = getParamRegexPattern(paramName)

  return path.replace(paramRegex, regexCaptureAll)
}

export function paramIsOptional(path: WithParams, paramName: string): boolean {
  const paramRegex = getOptionalParamRegexPattern(paramName)

  return paramRegex.test(path.value)
}

export function isOptionalParamSyntax(value: string): boolean {
  return new RegExp(optionalParamRegex, 'g').test(value)
}

export function isRequiredParamSyntax(value: string): boolean {
  return new RegExp(requiredParamRegex, 'g').test(value)
}

export const paramRegex = `\\${paramStart}\\??([\\w-_]+)\\${paramEnd}`
export const optionalParamRegex = `\\${paramStart}\\?([\\w-_]+)\\${paramEnd}`
export const requiredParamRegex = `\\${paramStart}([\\w-_]+)\\${paramEnd}`
export const regexCatchAll = '.*'
export const regexCaptureAll = '(.*)'

export function getParamName(value: string): string | undefined {
  const [paramName] = getCaptureGroups(value, new RegExp(paramRegex, 'g'))

  return paramName
}

export function getParamRegexPattern(paramName: string): RegExp {
  return new RegExp(`\\${paramStart}\\??${paramName}\\${paramEnd}`, 'g')
}

function getOptionalParamRegexPattern(paramName: string): RegExp {
  return new RegExp(`\\${paramStart}\\?${paramName}\\${paramEnd}`, 'g')
}

export function getCaptureGroups(value: string, pattern: RegExp): (string | undefined)[] {
  const matches = Array.from(value.matchAll(pattern))

  return matches.flatMap(([, ...values]) => values.map((value) => {
    return stringHasValue(value) ? value : ''
  }))
}
