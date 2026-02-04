import { paramEnd, paramStart } from '@/types/params'
import { stringHasValue } from '@/utilities/guards'

export const paramRegex = `\\${paramStart}\\??([\\w-_]+)\\*?\\${paramEnd}`
export const optionalParamRegex = `\\${paramStart}\\?([\\w-_]+)\\*?\\${paramEnd}`
export const requiredParamRegex = `\\${paramStart}([\\w-_]+)\\*?\\${paramEnd}`
export const greedyParamRegex = `\\${paramStart}\\??([\\w-_]+)\\*\\${paramEnd}`
export const regexCatchAll = '[^/]*'
export const regexGreedyCatchAll = '.*'
export const regexCaptureAll = '([^/]*)'
export const regexGreedyCaptureAll = '(.*)'

export function escapeRegExp(string: string): string {
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

export function generateRouteHostRegexPattern(host: string): RegExp {
  const hostRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(host)

  return new RegExp(`^${hostRegex || '.*'}$`, 'i')
}

export function generateRoutePathRegexPattern(path: string): RegExp {
  const pathRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(path)

  return new RegExp(`^${pathRegex}$`, 'i')
}

export function generateRouteHashRegexPattern(hash: string): RegExp {
  const cleanValue = hash.replace(/^#*/, '')
  const hashRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(cleanValue)

  return new RegExp(`^#?${hashRegex || '.*'}$`, 'i')
}

export function generateRouteQueryRegexPatterns(query: string): RegExp[] {
  const queryParams = new URLSearchParams(query)

  return Array
    .from(queryParams.entries())
    .filter(([, value]) => !isOptionalParamSyntax(value))
    .map(([key, value]) => {
      const valueRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(value)

      return new RegExp(`${escapeRegExp(key)}=${valueRegex}(&|$)`, 'i')
    })
}

export function replaceParamSyntaxWithCatchAllsAndEscapeRest(value: string): string {
  return splitByMatches(value, new RegExp(paramRegex, 'g'))
    .map((slice) => {
      const isParam = slice.startsWith(paramStart)

      return isParam ? replaceParamSyntaxWithCatchAlls(slice) : escapeRegExp(slice)
    })
    .join('')
}

export function replaceParamSyntaxWithCatchAlls(value: string): string {
  return value.replace(new RegExp(paramRegex, 'g'), (match) => {
    return isGreedyParamSyntax(match) ? regexGreedyCatchAll : regexCatchAll
  })
}

export function replaceIndividualParamWithCaptureGroup(path: string, paramName: string): string {
  const pattern = getParamRegexPattern(paramName)
  const capturePattern = paramIsGreedy(path, paramName) ? regexGreedyCaptureAll : regexCaptureAll

  return path.replace(pattern, capturePattern)
}

export function paramIsOptional(path: string, paramName: string): boolean {
  const paramRegex = getOptionalParamRegexPattern(paramName)

  return paramRegex.test(path)
}

export function paramIsGreedy(path: string, paramName: string): boolean {
  const greedyPattern = getGreedyParamRegexPattern(paramName)

  return greedyPattern.test(path)
}

export function isOptionalParamSyntax(value: string): boolean {
  return new RegExp(optionalParamRegex, 'g').test(value)
}

export function isRequiredParamSyntax(value: string): boolean {
  return new RegExp(requiredParamRegex, 'g').test(value)
}

export function isGreedyParamSyntax(value: string): boolean {
  return new RegExp(greedyParamRegex, 'g').test(value)
}

export function getParamName(value: string): string | undefined {
  const [paramName] = getCaptureGroups(value, new RegExp(paramRegex, 'g'))

  return paramName
}

export function getParamRegexPattern(paramName: string): RegExp {
  return new RegExp(`\\${paramStart}\\??${paramName}\\*?\\${paramEnd}`, 'g')
}

function getOptionalParamRegexPattern(paramName: string): RegExp {
  return new RegExp(`\\${paramStart}\\?${paramName}\\*?\\${paramEnd}`, 'g')
}

function getGreedyParamRegexPattern(paramName: string): RegExp {
  return new RegExp(`\\${paramStart}\\??${paramName}\\*\\${paramEnd}`, 'g')
}

export function getCaptureGroups(value: string, pattern: RegExp): (string | undefined)[] {
  const matches = Array.from(value.matchAll(pattern))

  return matches.flatMap(([, ...values]) => values.map((value) => {
    return stringHasValue(value) ? value : ''
  }))
}
