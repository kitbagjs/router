import { setParamValue } from '@/services/params'
import { getCaptureGroups, getParamRegexPattern, paramIsOptional, replaceIndividualParamWithCaptureGroup, replaceParamSyntaxWithCatchAlls } from '@/services/routeRegex'
import { WithParams } from './withParams'

export function getParamValueFromUrl(url: string, path: WithParams, paramName: string): string | undefined {
  const paramNameCaptureGroup = replaceIndividualParamWithCaptureGroup(path.value, paramName)
  const otherParamsCatchAll = replaceParamSyntaxWithCatchAlls(paramNameCaptureGroup)

  const [paramValue] = getCaptureGroups(url, new RegExp(otherParamsCatchAll, 'g'))

  return paramValue
}

export function setParamValueOnUrl(url: string, path: WithParams, paramName: string, value: unknown): string {
  const isOptional = paramIsOptional(path.value, paramName)
  const paramValue = setParamValue(value, path.params[paramName], isOptional)

  return url.replace(getParamRegexPattern(paramName), paramValue)
}
