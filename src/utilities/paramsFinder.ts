import { Param } from '@/types'
import { setParamValue } from '@/utilities/params'
import { Path } from '@/utilities/path'
import { replaceParamSyntaxWithCatchAlls } from '@/utilities/routeRegex'
import { stringHasValue } from '@/utilities/string'

export function getParamValueFromUrl(url: string, path: Path | string, paramName: string): string | undefined {
  const regexPattern = getParamRegexPattern(path.toString(), paramName)
  const [paramValue] = getCaptureGroups(url, regexPattern)

  return paramValue
}

export type ParamReplace = {
  name: string,
  param: Param,
  value?: unknown,
}

export function setParamValueOnUrl(path: string, paramReplace?: ParamReplace): string {
  if (!paramReplace) {
    return path
  }

  const { name, param, value } = paramReplace
  const regexPattern = getParamRegexPattern(path, name)
  const captureGroups = getCaptureGroups(path, regexPattern)

  return captureGroups.reduce((url, captureGroup) => {
    return url.replace(captureGroup, () => setParamValue(value, param))
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