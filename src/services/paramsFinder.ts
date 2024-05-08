import { setParamValue } from '@/services/params'
import { getCaptureGroups, replaceParamSyntaxWithCatchAlls } from '@/services/routeRegex'
import { Param } from '@/types/paramTypes'

export function getParamValueFromUrl(url: string, path: string, paramName: string): string | undefined {
  const regexPattern = getParamRegexPattern(path, paramName)
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

  return captureGroups.reduce<string>((url, captureGroup) => {
    if (captureGroup === undefined) {
      return url
    }

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

  return path.replace(optionalParamRegex, '([^\\/]*)')
}

function replaceRequiredParamSyntaxWithCaptureGroup(path: string, paramName: string): string {
  const requiredParamRegex = new RegExp(`(:${paramName})(?=\\W|$)`, 'g')

  return path.replace(requiredParamRegex, '([^\\/]+)')
}