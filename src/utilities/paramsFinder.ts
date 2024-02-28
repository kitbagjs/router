import { Param } from '@/types'
import { setParamValue } from '@/utilities/params'
import { replaceParamSyntaxWithCatchAlls } from '@/utilities/routeRegex'
import { stringHasValue } from '@/utilities/string'

export function getParamValuesFromUrl(url: string, path: string, paramName: string): string[] {
  const regexPattern = getParamRegexPattern(path, paramName)

  return getCaptureGroups(url, regexPattern)
}

export type ParamReplace = {
  name: string,
  params?: Param[],
  values?: unknown,
}

export function setParamValuesOnUrl(path: string, paramReplace?: ParamReplace): string {
  if (!paramReplace) {
    return path
  }

  const { name, params = [], values = [] } = paramReplace
  const regexPattern = getParamRegexPattern(path, name)
  const captureGroups = getCaptureGroups(path, regexPattern)

  return captureGroups.reduce((value, captureGroup, index) => {
    const valueForIndex = Array.isArray(values) ? values[index] : values
    return value.replace(captureGroup, () => setParamValue(valueForIndex, params[index++]))
  }, path)
}

function getParamRegexPattern(path: string, paramName: string): RegExp {
  const regexPattern = [
    replaceOptionalParamSyntaxWithCaptureGroup,
    replaceRequiredParamSyntaxWithCaptureGroup,
    replaceParamSyntaxWithCatchAlls,
  ].reduce((pattern, regexBuild) => {
    return regexBuild(pattern, paramName)
  }, path)

  return new RegExp(regexPattern, 'g')
}

function replaceOptionalParamSyntaxWithCaptureGroup(path: string, paramName: string): string {
  const optionalParamRegex = new RegExp(`(:\\?${paramName})(?=\\W|$)`, 'g')

  return path.replace(optionalParamRegex, '([^/]*)')
}

function replaceRequiredParamSyntaxWithCaptureGroup(path: string, paramName: string): string {
  const requiredParamRegex = new RegExp(`(:${paramName})(?=\\W|$)`, 'g')

  return path.replace(requiredParamRegex, '([^/]+)')
}

function getCaptureGroups(value: string, pattern: RegExp): string[] {
  const matches = Array.from(value.matchAll(pattern))

  return matches.flatMap(([, ...values]) => values.map(value => stringHasValue(value) ? value : ''))
}